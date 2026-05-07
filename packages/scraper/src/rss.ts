import { asStringFromKeys } from "./accessors.ts";
import { decodeResponseBody } from "./encoding.ts";
import { generateIdFromUrl, toIso8601 } from "./helpers.ts";
import { fetchWithRetry } from "./network.ts";
import { computeScoreAndTags, KEYWORD_RULES } from "./scoring.ts";
import type { PolicyUpdate, RssFeedSource } from "./types.ts";
import { extractRawItems, parseXml, resolveAtomLink } from "./xml.ts";

// ─── RSS Sources ──────────────────────────────────────────────────────────────
// 省庁の実際の公開RSSエンドポイントを指定。
// RSS 1.0 (.rdf) と RSS 2.0 (.xml) が混在するため、パーサー側での対応に注意する。

export const RSS_SOURCES: RssFeedSource[] = [
  {
    sourceName: "経済産業省",
    url: "https://www.meti.go.jp/ml_index_release_atom.xml", // 経産省 新着情報
  },
  {
    sourceName: "総務省",
    url: "https://www.soumu.go.jp/news.rdf", // 総務省 報道資料 (AI事業者ガイドライン等を管轄)
  },
  {
    sourceName: "内閣府",
    url: "https://www.cao.go.jp/rss/news.rdf", // 内閣府 新着情報 (AI戦略会議など)
  },
  {
    sourceName: "デジタル庁",
    url: "https://www.digital.go.jp/rss/news.xml", // デジタル庁 ニュースRSS
  },
  {
    sourceName: "文部科学省",
    url: "https://www.mext.go.jp/b_menu/news/index.rdf", // 文部科学省 新着情報
  },
  {
    sourceName: "厚生労働省",
    url: "https://www.mhlw.go.jp/stf/news.rdf", // 厚生労働省 報道発表
  },
];

// ─── Item Normalization ───────────────────────────────────────────────────────

const DATE_KEYS = ["pubDate", "published", "dc:date", "updated"] as const;

export const normalizeItem = (item: Record<string, unknown>, source: RssFeedSource): PolicyUpdate | null => {
  const title = asStringFromKeys(item, ["title"]);

  // RSS 2.0 / RDF は link がテキスト、Atom は link がオブジェクトまたは配列。
  // まず文字列として試み、取れなければ resolveAtomLink でフォールバック。
  const url = asStringFromKeys(item, ["link", "guid", "id"]) ?? resolveAtomLink(item["link"]);

  if (title === undefined || url === undefined) return null;

  const rawDate = asStringFromKeys(item, DATE_KEYS);
  const { score, tags } = computeScoreAndTags(title, KEYWORD_RULES);

  return {
    id: generateIdFromUrl(url),
    title,
    url,
    publishedAt: rawDate !== undefined ? toIso8601(rawDate) : new Date().toISOString(),
    source: source.sourceName,
    score,
    tags,
  };
};

// ─── Source Fetching ──────────────────────────────────────────────────────────

export const fetchSourceUpdates = async (source: RssFeedSource): Promise<PolicyUpdate[]> => {
  try {
    const response = await fetchWithRetry(source.url);
    const xmlText = await decodeResponseBody(response);
    const parsed = parseXml(xmlText);
    const rawItems = extractRawItems(parsed);

    return rawItems.map((item) => normalizeItem(item, source)).filter((item): item is PolicyUpdate => item !== null);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const { sourceName, url } = source;
    console.warn(`[scraper] "${sourceName}" の取得をスキップします (${url}): ${msg}`);
    return [];
  }
};
