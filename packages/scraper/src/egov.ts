import { asString, isObject } from "./accessors.ts";
import { generateIdFromUrl, toIso8601 } from "./helpers.ts";
import { computeScoreAndTags, KEYWORD_RULES } from "./scoring.ts";
import type { PolicyUpdate } from "./types.ts";

// ─── e-Gov CKAN API ───────────────────────────────────────────────────────────

const EGOV_API_BASE = "https://data.e-gov.go.jp/data/api/action/package_search";
const EGOV_API_QUERY =
  "?q=" +
  encodeURIComponent("AI OR 人工知能 OR ガバナンス OR ガイドライン") +
  "&sort=" +
  encodeURIComponent("metadata_modified desc") +
  "&rows=20";

export const EGOV_API_URL = EGOV_API_BASE + EGOV_API_QUERY;

// CKAN package_search が返す各パッケージの形状（type-safe accessors 経由でアクセス）
type CkanPackage = Record<string, unknown>;

const isCkanResultArray = (value: unknown): value is CkanPackage[] => Array.isArray(value) && value.every(isObject);

const isCkanSearchResult = (value: unknown): value is Record<string, unknown> => {
  if (!isObject(value)) return false;
  const result = (value as Record<string, unknown>)["result"];
  if (!isObject(result)) return false;
  return isCkanResultArray((result as Record<string, unknown>)["results"]);
};

export const parseEGovResponse = (data: unknown): PolicyUpdate[] => {
  if (!isCkanSearchResult(data)) return [];
  const result = (data as Record<string, unknown>)["result"] as Record<string, unknown>;
  const results = result["results"] as CkanPackage[];

  return results
    .map((pkg): PolicyUpdate | null => {
      const name = asString(pkg["name"]);
      const title = asString(pkg["title"]);
      const notes = asString(pkg["notes"]) ?? "";
      const modified = asString(pkg["metadata_modified"]);
      if (name === undefined || title === undefined) return null;
      const url = `https://data.e-gov.go.jp/data/dataset/${name}`;
      const { score, tags } = computeScoreAndTags(`${title} ${notes}`, KEYWORD_RULES);
      if (score <= 0) return null;
      return {
        id: generateIdFromUrl(url),
        title,
        url,
        publishedAt: modified !== undefined ? toIso8601(modified) : new Date().toISOString(),
        source: "e-Govデータポータル",
        score,
        tags,
      };
    })
    .filter((item): item is PolicyUpdate => item !== null);
};

// URL とタイトルの両方で重複を除去する純粋関数。
export const removeDuplicates = (items: PolicyUpdate[]): PolicyUpdate[] => {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  return items.filter((item) => {
    if (seenUrls.has(item.url) || seenTitles.has(item.title)) return false;
    seenUrls.add(item.url);
    seenTitles.add(item.title);
    return true;
  });
};
