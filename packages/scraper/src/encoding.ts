import { decode as iconvDecode } from "iconv-lite";

// ─── Encoding Detection & Decoding ───────────────────────────────────────────
// Bun の TextDecoder は UTF-8 / UTF-16 しかサポートしないため、
// Shift-JIS / EUC-JP を使う政府サイトでは文字化けが発生する。
// Content-Type ヘッダーまたは XML 宣言からエンコーディングを検出し、
// iconv-lite で正しくデコードする。

export const extractCharsetFromHeader = (contentType: string | null): string | undefined => {
  if (contentType === null) return undefined;
  const match = /charset=([^\s;]+)/i.exec(contentType);
  return match?.[1];
};

export const extractCharsetFromXmlDecl = (bytes: Buffer): string | undefined => {
  // XML 宣言は ASCII 互換なので先頭 200 バイトを Latin-1 で読めばエンコーディング名を取得できる。
  const head = bytes.subarray(0, 200).toString("latin1");
  const match = /encoding=["']([^"']+)["']/i.exec(head);
  return match?.[1];
};

export const decodeResponseBody = async (response: Response): Promise<string> => {
  const buffer = Buffer.from(await response.arrayBuffer());
  const charset =
    extractCharsetFromHeader(response.headers.get("content-type")) ?? extractCharsetFromXmlDecl(buffer) ?? "utf-8";
  return iconvDecode(buffer, charset);
};
