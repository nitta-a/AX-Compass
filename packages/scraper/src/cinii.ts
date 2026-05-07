import { asString, isArrayOfObjects, isObject } from "./accessors.ts";
import { generateIdFromUrl, toIso8601 } from "./helpers.ts";
import { computeScoreAndTags, KEYWORD_RULES } from "./scoring.ts";
import type { PolicyUpdate } from "./types.ts";

// ─── CiNii Research OpenSearch API ───────────────────────────────────────────
// JSON-LD 形式でのレスポンスを返す国立情報学研究所の学術情報検索エンドポイント。

const CINII_API_BASE = "https://cir.nii.ac.jp/opensearch/all";
const CINII_API_QUERY =
  "?q=" +
  encodeURIComponent(
    "AI ガバナンス OR デジタルスキル標準 OR LLM 倫理 OR 生成AI ガイドライン OR AX人材 OR AI人材 OR リスキリング",
  ) +
  "&count=30&sortorder=1&format=json";

export const CINII_API_URL = CINII_API_BASE + CINII_API_QUERY;

// ─── JSON-LD Item Extractors ──────────────────────────────────────────────────
// CiNii の JSON-LD レスポンス構造は @graph[0].items または items に格納される。

type CiniiItem = Record<string, unknown>;

const extractCiniiItems = (data: unknown): CiniiItem[] => {
  if (!isObject(data)) return [];

  // @graph[0].items を優先して試みる
  const graph = data["@graph"];
  if (Array.isArray(graph) && graph.length > 0 && isObject(graph[0])) {
    const graphItems = (graph[0] as Record<string, unknown>)["items"];
    if (isArrayOfObjects(graphItems)) return graphItems;
  }

  // フォールバック: トップレベルの items
  const topItems = data["items"];
  if (isArrayOfObjects(topItems)) return topItems;

  return [];
};

// title フィールドは文字列または {"@value": string, "@language": string} の両形式がある。
const extractTitle = (item: CiniiItem): string | undefined => {
  const direct = asString(item["title"]);
  if (direct !== undefined) return direct;
  if (isObject(item["title"])) {
    return asString((item["title"] as Record<string, unknown>)["@value"]);
  }
  return undefined;
};

// url は @id 直接、またはネストされた link["@id"] から取得する。
const extractUrl = (item: CiniiItem): string | undefined => {
  const direct = asString(item["@id"]);
  if (direct !== undefined) return direct;
  if (isObject(item["link"])) {
    return asString((item["link"] as Record<string, unknown>)["@id"]);
  }
  return undefined;
};

// ─── Response Parser ──────────────────────────────────────────────────────────

export const parseCiniiResponse = (data: unknown): PolicyUpdate[] => {
  const items = extractCiniiItems(data);

  return items
    .map((item): PolicyUpdate | null => {
      const title = extractTitle(item);
      const url = extractUrl(item);
      if (title === undefined || url === undefined) return null;

      const rawDate = asString(item["dc:date"]);
      const publisher = asString(item["dc:publisher"]);
      const { score, tags } = computeScoreAndTags(title, KEYWORD_RULES);
      if (score < 1) return null;

      return {
        id: generateIdFromUrl(url),
        title,
        url,
        publishedAt: rawDate !== undefined ? toIso8601(rawDate) : new Date().toISOString(),
        source: publisher ?? "CiNii Research",
        score,
        tags,
      };
    })
    .filter((item): item is PolicyUpdate => item !== null);
};
