import { writeLatestDataset } from "./src/dataset.ts";
export type { KeywordRule, PolicyUpdate } from "./src/types.ts";
export { generateLatestDataset, writeLatestDataset } from "./src/dataset.ts";

// ─── Entry Point ──────────────────────────────────────────────────────────────

const run = async (): Promise<void> => {
  const outputPath = await writeLatestDataset();
  console.log(`[scraper] ${outputPath} に書き出しました`);
};

await run();
