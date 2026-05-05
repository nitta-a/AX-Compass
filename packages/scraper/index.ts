import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { decode as iconvDecode } from "iconv-lite";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeywordRule {
  word: string;
  weight: number;
  category: "AI_CORE" | "GOVERNANCE" | "CONTEXT";
}

export interface PolicyUpdate {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  score: number;
  tags: string[];
}

interface PolicyDataset {
  generatedAt: string;
  itemCount: number;
  items: PolicyUpdate[];
}

interface RssFeedSource {
  sourceName: string;
  url: string;
}

// ─── RSS Sources ──────────────────────────────────────────────────────────────
// 省庁の実際の公開RSSエンドポイントを指定。
// RSS 1.0 (.rdf) と RSS 2.0 (.xml) が混在するため、パーサー側での対応に注意する。

const RSS_SOURCES: RssFeedSource[] = [
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
];

// ─── Network Constants ────────────────────────────────────────────────────────

const SCRAPER_USER_AGENT = "AX-Compass-Bot/1.0";
const RETRYABLE_STATUS_CODES = new Set([403, 503]);
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 800;
const MAX_RETRY_DELAY_MS = 10_000;
const INTER_REQUEST_DELAY_MS = 1_500;

// ─── XML Parser ───────────────────────────────────────────────────────────────
// XMLParser は fast-xml-parser が提供する外部クラス。
// 自前クラスは定義せず、オプション生成と呼び出しを純粋関数で構成する。

const createXmlParserOptions = () =>
  ({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    isArray: (tagName: string) => tagName === "item" || tagName === "entry",
  }) as const;

const parseXml = (xmlText: string): unknown => {
  const parser = new XMLParser(createXmlParserOptions());
  return parser.parse(xmlText);
};

// ─── Type-safe Accessors ──────────────────────────────────────────────────────

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isArrayOfObjects = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isObject);

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asStringFromKeys = (obj: Record<string, unknown>, keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const result = asString(obj[key]);
    if (result !== undefined) return result;
  }
  return undefined;
};

// ─── ID & Date Helpers ────────────────────────────────────────────────────────

const generateIdFromUrl = (url: string): string => {
  try {
    const { hostname, pathname, search } = new URL(url);
    const raw = `${hostname}${pathname}${search}`;
    return raw
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  } catch {
    return url
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  }
};

const toIso8601 = (dateString: string): string => {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

// ─── Atom <link> Resolver ─────────────────────────────────────────────────────
// Atom では <link href="..."/> が属性になるためテキストノードとして取れない。
// 配列の場合は rel="alternate" を優先し、なければ最初の href を返す。

const resolveAtomLink = (linkValue: unknown): string | undefined => {
  if (typeof linkValue === "string") return asString(linkValue);

  if (isObject(linkValue)) return asString(linkValue["@_href"]);

  if (Array.isArray(linkValue)) {
    for (const entry of linkValue) {
      if (!isObject(entry)) continue;
      const rel = asString(entry["@_rel"]) ?? "alternate";
      if (rel === "alternate") {
        const href = asString(entry["@_href"]);
        if (href !== undefined) return href;
      }
    }
    for (const entry of linkValue) {
      if (isObject(entry)) {
        const href = asString(entry["@_href"]);
        if (href !== undefined) return href;
      }
    }
  }

  return undefined;
};

// ─── Raw Item Extraction (RSS 2.0 / Atom / RDF) ───────────────────────────────

const extractFromRss2 = (parsed: unknown): Record<string, unknown>[] => {
  if (!isObject(parsed)) return [];
  const rss = parsed["rss"];
  if (!isObject(rss)) return [];
  const channel = rss["channel"];
  if (!isObject(channel)) return [];
  const items = channel["item"];
  return isArrayOfObjects(items) ? items : [];
};

const extractFromAtom = (parsed: unknown): Record<string, unknown>[] => {
  if (!isObject(parsed)) return [];
  const feed = parsed["feed"];
  if (!isObject(feed)) return [];
  const entries = feed["entry"];
  return isArrayOfObjects(entries) ? entries : [];
};

const extractFromRdf = (parsed: unknown): Record<string, unknown>[] => {
  if (!isObject(parsed)) return [];
  // RDF/RSS 1.0 のルートキーは名前空間宣言によって変わるため両方を試みる。
  const rdf = parsed["rdf:RDF"] ?? parsed["RDF"];
  if (!isObject(rdf)) return [];
  const items = rdf["item"];
  return isArrayOfObjects(items) ? items : [];
};

const extractRawItems = (parsed: unknown): Record<string, unknown>[] => {
  const rss2 = extractFromRss2(parsed);
  if (rss2.length > 0) return rss2;

  const atom = extractFromAtom(parsed);
  if (atom.length > 0) return atom;

  return extractFromRdf(parsed);
};

// ─── Item Normalization ───────────────────────────────────────────────────────

const DATE_KEYS = ["pubDate", "published", "dc:date", "updated"] as const;

const normalizeItem = (item: Record<string, unknown>, source: RssFeedSource): PolicyUpdate | null => {
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

// ─── Encoding Detection & Decoding ───────────────────────────────────────────
// Bun の TextDecoder は UTF-8 / UTF-16 しかサポートしないため、
// Shift-JIS / EUC-JP を使う政府サイトでは文字化けが発生する。
// Content-Type ヘッダーまたは XML 宣言からエンコーディングを検出し、
// iconv-lite で正しくデコードする。

const extractCharsetFromHeader = (contentType: string | null): string | undefined => {
  if (contentType === null) return undefined;
  const match = /charset=([^\s;]+)/i.exec(contentType);
  return match?.[1];
};

const extractCharsetFromXmlDecl = (bytes: Buffer): string | undefined => {
  // XML 宣言は ASCII 互換なので先頭 200 バイトを Latin-1 で読めばエンコーディング名を取得できる。
  const head = bytes.subarray(0, 200).toString("latin1");
  const match = /encoding=["']([^"']+)["']/i.exec(head);
  return match?.[1];
};

const decodeResponseBody = async (response: Response): Promise<string> => {
  const buffer = Buffer.from(await response.arrayBuffer());
  const charset =
    extractCharsetFromHeader(response.headers.get("content-type")) ?? extractCharsetFromXmlDecl(buffer) ?? "utf-8";
  return iconvDecode(buffer, charset);
};

// ─── Network Layer ────────────────────────────────────────────────────────────

const createRequestInit = (): RequestInit => ({
  headers: {
    Accept:
      "application/rss+xml, application/atom+xml, application/rdf+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
    "User-Agent": SCRAPER_USER_AGENT,
  },
});

const sleep = async (milliseconds: number): Promise<void> => {
  await Bun.sleep(milliseconds);
};

const calculateBackoffDelay = (attempt: number): number =>
  Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);

const isRetryableNetworkError = (error: unknown): boolean =>
  error instanceof Error && /(network|timed out|fetch failed|socket|connect|dns)/i.test(error.message);

const fetchWithRetry = async (url: string): Promise<Response> => {
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, createRequestInit());

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

// ─── Keyword Scoring ─────────────────────────────────────────────────────────
// タイトルに含まれるキーワードに基づきスコアとカテゴリタグを算出する純粋関数群。
// score > 0 のアイテムのみを最終データセットに含める。
// キーワードは大文字小文字を区別して比較する（"AI" と "ai" を区別するため）。

const KEYWORD_RULES: readonly KeywordRule[] = [
  // AI_CORE: AI 技術そのものに関する用語（高スコア）
  { word: "AI", weight: 10, category: "AI_CORE" },
  { word: "生成AI", weight: 10, category: "AI_CORE" },
  { word: "LLM", weight: 10, category: "AI_CORE" },
  { word: "人工知能", weight: 10, category: "AI_CORE" },
  { word: "機械学習", weight: 10, category: "AI_CORE" },
  { word: "ディープラーニング", weight: 8, category: "AI_CORE" },
  { word: "深層学習", weight: 8, category: "AI_CORE" },
  { word: "大規模言語モデル", weight: 10, category: "AI_CORE" },
  { word: "プロンプト", weight: 6, category: "AI_CORE" },
  { word: "アルゴリズム", weight: 4, category: "AI_CORE" },
  // GOVERNANCE: 政策・法制度に関する用語（中スコア）
  { word: "ガイドライン", weight: 5, category: "GOVERNANCE" },
  { word: "ガバナンス", weight: 5, category: "GOVERNANCE" },
  { word: "著作権", weight: 4, category: "GOVERNANCE" },
  { word: "個人情報", weight: 4, category: "GOVERNANCE" },
  { word: "プライバシー", weight: 4, category: "GOVERNANCE" },
  { word: "規制改革", weight: 3, category: "GOVERNANCE" },
  { word: "情報セキュリティ", weight: 4, category: "GOVERNANCE" },
  { word: "サイバーセキュリティ", weight: 4, category: "GOVERNANCE" },
  { word: "倫理", weight: 3, category: "GOVERNANCE" },
  // CONTEXT: DX・行政デジタル化に関する用語（低スコア）
  { word: "AX", weight: 3, category: "CONTEXT" },
  { word: "DX", weight: 2, category: "CONTEXT" },
  { word: "デジタルトランスフォーメーション", weight: 2, category: "CONTEXT" },
  { word: "デジタル化", weight: 2, category: "CONTEXT" },
  { word: "デジタル庁", weight: 2, category: "CONTEXT" },
  { word: "ガバメントクラウド", weight: 2, category: "CONTEXT" },
  { word: "マイナンバー", weight: 1, category: "CONTEXT" },
  { word: "データ連携", weight: 2, category: "CONTEXT" },
  { word: "データ戦略", weight: 2, category: "CONTEXT" },
  { word: "自動化", weight: 1, category: "CONTEXT" },
  { word: "クラウド", weight: 1, category: "CONTEXT" },
];

interface ScoreResult {
  score: number;
  tags: string[];
}

// 単一テキストに対してスコアと一致カテゴリの配列を返す純粋関数。
// 同一カテゴリのキーワードが複数マッチしても重複タグは生成しない。
const computeScoreAndTags = (text: string, rules: readonly KeywordRule[]): ScoreResult => {
  let score = 0;
  const matchedCategories = new Set<KeywordRule["category"]>();

  for (const rule of rules) {
    if (text.includes(rule.word)) {
      score += rule.weight;
      matchedCategories.add(rule.category);
    }
  }

  return { score, tags: [...matchedCategories] };
};

// score が 0 より大きいアイテムのみを関連情報として扱う。
const isRelevantPolicy = (item: PolicyUpdate): boolean => item.score > 0;

// ─── Source Fetching Pipeline ─────────────────────────────────────────────────

const fetchSourceUpdates = async (source: RssFeedSource): Promise<PolicyUpdate[]> => {
  try {
    const response = await fetchWithRetry(source.url);
    const xmlText = await decodeResponseBody(response);
    const parsed = parseXml(xmlText);
    const rawItems = extractRawItems(parsed);

    return rawItems.map((item) => normalizeItem(item, source)).filter((item): item is PolicyUpdate => item !== null);
  } catch (error) {
    console.warn(
      `[scraper] "${source.sourceName}" の取得をスキップします (${source.url}):`,
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
};

// 複数ソースを直列処理し、リクエスト間に意図的な遅延を挟む（WAF 対策）。
// Promise.all による並列アクセスは禁止。
// 全ソースの収集後にキーワードフィルタを一括適用する。
const collectPolicyUpdates = async (sources: RssFeedSource[]): Promise<PolicyUpdate[]> => {
  const allUpdates: PolicyUpdate[] = [];

  for (const source of sources) {
    const updates = await fetchSourceUpdates(source);
    allUpdates.push(...updates);
    await sleep(INTER_REQUEST_DELAY_MS);
  }

  const filtered = allUpdates.filter(isRelevantPolicy);
  console.log(`[scraper] フィルタ前: ${allUpdates.length} 件 → フィルタ後: ${filtered.length} 件`);
  return filtered;
};

// ─── Dataset Assembly & I/O ───────────────────────────────────────────────────

const buildDataset = (items: PolicyUpdate[]): PolicyDataset => ({
  generatedAt: new Date().toISOString(),
  itemCount: items.length,
  items,
});

const getOutputPath = (): string => resolve(import.meta.dir, "../../apps/frontend/public/data/latest.json");

const writeDataset = async (dataset: PolicyDataset, outputPath: string): Promise<void> => {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const generateLatestDataset = async (): Promise<PolicyDataset> => {
  const items = await collectPolicyUpdates(RSS_SOURCES);
  return buildDataset(items);
};

export const writeLatestDataset = async (): Promise<string> => {
  const dataset = await generateLatestDataset();
  const outputPath = getOutputPath();
  await writeDataset(dataset, outputPath);
  return outputPath;
};

// ─── Entry Point ──────────────────────────────────────────────────────────────

const run = async (): Promise<void> => {
  const outputPath = await writeLatestDataset();
  console.log(`[scraper] ${outputPath} に書き出しました`);
};

await run();
