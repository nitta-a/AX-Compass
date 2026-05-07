import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateLatestDataset } from "./src/dataset.ts";
import { buildSummaryPrompt, generateSummary } from "./src/llm.ts";
import type { PolicyDataset } from "./src/types.ts";

export { generateLatestDataset, writeLatestDataset } from "./src/dataset.ts";
export type { KeywordRule, PolicyUpdate } from "./src/types.ts";

// ─── Output Path ──────────────────────────────────────────────────────────────
// packages/scraper/ から 2 階層上がってモノレポルートへ到達する。

const OUTPUT_PATH = resolve(import.meta.dir, "../../apps/frontend/public/data/latest.json");

const writeDataset = async (dataset: PolicyDataset): Promise<void> => {
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
};

// ─── Gemini 要約エンリッチメント ─────────────────────────────────────────────
// Tier 1（score >= 10）かつ summary 未設定のアイテムのみを対象とする。
// 無料枠レートリミット対策として 1 リクエストごとに 4 秒待機する。

const enrichWithSummaries = async (dataset: PolicyDataset, apiKey: string): Promise<PolicyDataset> => {
  const tier1Unsummarized = dataset.items.filter((item) => item.score >= 10 && item.summary === undefined);

  console.log(`[scraper] Gemini要約対象: Tier1かつ未要約 ${tier1Unsummarized.length} 件`);

  for (const item of tier1Unsummarized) {
    const prompt = buildSummaryPrompt(item.title, item.source);
    const summary = await generateSummary(prompt, apiKey);
    if (summary !== null) {
      item.summary = summary;
    }
    await Bun.sleep(4_000);
  }

  return dataset;
};

// ─── Entry Point ──────────────────────────────────────────────────────────────

const buildPolicyData = async (): Promise<string> => {
  const dataset = await generateLatestDataset();

  // GEMINI_API_KEY が設定されている場合のみ要約エンリッチメントを実行する。
  // ローカル開発では .env から、CI では環境変数から取得する（Bun が自動でロード）。
  const apiKey = process.env.GEMINI_API_KEY;
  const enriched = apiKey !== undefined ? await enrichWithSummaries(dataset, apiKey) : dataset;

  await writeDataset(enriched);
  return OUTPUT_PATH;
};

const run = async (): Promise<void> => {
  const outputPath = await buildPolicyData();
  console.log(`[scraper] ${outputPath} に書き出しました`);
};

await run();
