import { XMLParser } from "fast-xml-parser";
import { asString, isArrayOfObjects, isObject } from "./accessors.ts";

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

export const parseXml = (xmlText: string): unknown => {
  const parser = new XMLParser(createXmlParserOptions());
  return parser.parse(xmlText);
};

// ─── Atom <link> Resolver ─────────────────────────────────────────────────────
// Atom では <link href="..."/> が属性になるためテキストノードとして取れない。
// 配列の場合は rel="alternate" を優先し、なければ最初の href を返す。

export const resolveAtomLink = (linkValue: unknown): string | undefined => {
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

export const extractFromRss2 = (parsed: unknown): Record<string, unknown>[] => {
  if (!isObject(parsed)) return [];
  const rss = parsed["rss"];
  if (!isObject(rss)) return [];
  const channel = rss["channel"];
  if (!isObject(channel)) return [];
  const items = channel["item"];
  return isArrayOfObjects(items) ? items : [];
};

export const extractFromAtom = (parsed: unknown): Record<string, unknown>[] => {
  if (!isObject(parsed)) return [];
  const feed = parsed["feed"];
  if (!isObject(feed)) return [];
  const entries = feed["entry"];
  return isArrayOfObjects(entries) ? entries : [];
};

export const extractFromRdf = (parsed: unknown): Record<string, unknown>[] => {
  if (!isObject(parsed)) return [];
  // RDF/RSS 1.0 のルートキーは名前空間宣言によって変わるため両方を試みる。
  const rdf = parsed["rdf:RDF"] ?? parsed["RDF"];
  if (!isObject(rdf)) return [];
  const items = rdf["item"];
  return isArrayOfObjects(items) ? items : [];
};

export const extractRawItems = (parsed: unknown): Record<string, unknown>[] => {
  const rss2 = extractFromRss2(parsed);
  if (rss2.length > 0) return rss2;

  const atom = extractFromAtom(parsed);
  if (atom.length > 0) return atom;

  return extractFromRdf(parsed);
};
