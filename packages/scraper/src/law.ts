import { asString, isArrayOfObjects, isObject } from "./accessors.ts";
import { generateIdFromUrl, toIso8601 } from "./helpers.ts";
import {
  BASE_RETRY_DELAY_MS,
  calculateBackoffDelay,
  isRetryableNetworkError,
  MAX_RETRIES,
  MAX_RETRY_DELAY_MS,
  RETRYABLE_STATUS_CODES,
  SCRAPER_USER_AGENT,
  sleep,
} from "./network.ts";
import type { PolicyUpdate } from "./types.ts";

// ─── e-Gov 法令検索 API v2 ────────────────────────────────────────────────────

const LAW_API_BASE = "https://laws.e-gov.go.jp/api/2/laws";

// AX/AI ガバナンスに直結する重要法令の一覧
export const TARGET_LAWS: readonly string[] = [
  "個人情報の保護に関する法律",
  "著作権法",
  "不正競争防止法",
  "デジタル社会形成基本法",
];

// ─── JSON 専用リクエスト初期化 ────────────────────────────────────────────────
// e-Gov 法令 API v2 は Accept: application/json を要求する。

const createJsonRequestInit = (): RequestInit => ({
  headers: {
    Accept: "application/json",
    "User-Agent": SCRAPER_USER_AGENT,
  },
});

// ─── 法令取得（指数的バックオフ付き）────────────────────────────────────────

const fetchJsonWithRetry = async (url: string): Promise<Response> => {
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, createJsonRequestInit());

      if (!response.ok && RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES) {
        await sleep(calculateBackoffDelay(attempt));
        attempt += 1;
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return response;
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isRetryableNetworkError(error)) {
        throw error;
      }
      await sleep(calculateBackoffDelay(attempt));
      attempt += 1;
    }
  }
};

// ─── Response Parser ──────────────────────────────────────────────────────────
// data.laws[0] を受け取り PolicyUpdate に変換する純粋関数。

type LawItem = Record<string, unknown>;

const isLawItem = (value: unknown): value is LawItem => isObject(value);

export const parseLawV2Response = (data: unknown): PolicyUpdate | null => {
  if (!isObject(data)) return null;
  const laws = data["laws"];
  if (!isArrayOfObjects(laws) || laws.length === 0) return null;

  const item = laws[0];
  if (!isLawItem(item)) return null;

  const lawId = asString(item["law_id"]);
  const lawTitle = asString(item["law_title"]);
  const updatedDate = asString(item["updated_date"]);

  if (lawId === undefined || lawTitle === undefined) return null;

  const url = `https://laws.e-gov.go.jp/document?lawid=${lawId}`;

  return {
    id: generateIdFromUrl(url),
    title: `${lawTitle} (現行法令)`,
    url,
    publishedAt: updatedDate !== undefined ? toIso8601(updatedDate) : new Date().toISOString(),
    source: "e-Gov 法令検索 (v2)",
    score: 15,
    tags: ["GOVERNANCE", "LAW"],
  };
};

// ─── 副作用関数: 法令名で検索して取得 ────────────────────────────────────────

export const fetchLawV2 = async (lawName: string): Promise<PolicyUpdate | null> => {
  const url = `${LAW_API_BASE}?law_title=${encodeURIComponent(lawName)}`;
  try {
    const response = await fetchJsonWithRetry(url);
    const data: unknown = await response.json();

    if (!isObject(data)) {
      console.warn(`[scraper] 法令 "${lawName}": 予期しないレスポンス形式`);
      return null;
    }

    const laws = data["laws"];
    if (!isArrayOfObjects(laws) || laws.length === 0) {
      console.warn(`[scraper] 法令 "${lawName}": 検索結果が 0 件でした`);
      return null;
    }

    return parseLawV2Response(data);
  } catch (error) {
    console.warn(
      `[scraper] 法令 "${lawName}" の取得をスキップします (${url}):`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
};
