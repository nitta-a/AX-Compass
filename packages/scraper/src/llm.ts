// ─── Gemini API Integration ───────────────────────────────────────────────────
// @google/genai SDK を使用して Gemini REST API を呼び出す。
// 純粋関数（buildSummaryPrompt）と副作用関数（generateSummary）を明確に分離する。

import { GoogleGenAI } from "@google/genai";

// ─── Pure Functions ───────────────────────────────────────────────────────────

const systemInstruction =
  "あなたはシステム開発・DX推進の専門家です。" +
  "以下の政府・行政機関の発表が、開発チームの実務（アーキテクチャ設計、セキュリティ、運用）に与える影響と注意点を、" +
  "客観的なファクトとして3行の箇条書きで要約してください。";

// Gemini へ送信するプロンプト文字列を構築する純粋関数。
export const buildSummaryPrompt = (title: string, source: string): string => {
  return `${systemInstruction}\n\nタイトル: ${title}\nソース: ${source}`;
};

// ─── Side-Effect Functions ────────────────────────────────────────────────────

const GEN_MODEL = "gemini-2.5-flash";
const LOG_PREFIX = "[llm] Gemini API: ";
const EMPTY_RES = `${LOG_PREFIX}空のレスポンスが返されました`;
const ERR_RES = `${LOG_PREFIX}API呼び出しに失敗しました`;

// Gemini 2.5 Flash API を呼び出し要約テキストを返す副作用関数。
// エラー時・空レスポンス時は警告を出力して null を返す。
export const generateSummary = async (prompt: string, apiKey: string): Promise<string | null> => {
  console.log(`${LOG_PREFIX}API を呼び出しています...`);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ model: GEN_MODEL, contents: prompt });

    const text = response.text;
    if (text === undefined || text === "") {
      console.warn(EMPTY_RES);
      return null;
    }
    console.log(`${LOG_PREFIX}要約が返されました: ${text.length} 文字`);
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(ERR_RES, msg);
    return null;
  }
};
