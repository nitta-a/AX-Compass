import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CINII_API_URL, parseCiniiResponse } from "./cinii.ts";
import { EGOV_API_URL, parseEGovResponse, removeDuplicates } from "./egov.ts";
import { fetchLawV2, TARGET_LAWS } from "./law.ts";
import { fetchUrl, INTER_REQUEST_DELAY_MS, sleep } from "./network.ts";
import { fetchSourceUpdates, RSS_SOURCES } from "./rss.ts";
import { isRelevantPolicy } from "./scoring.ts";
import type { PolicyDataset, PolicyUpdate, RssFeedSource } from "./types.ts";

// ─── Fetch Pipeline ───────────────────────────────────────────────────────────
// 複数ソースを直列処理し、リクエスト間に意図的な遅延を挟む（WAF 対策）。
// Promise.all による並列アクセスは禁止。
// RSS ソース収集後に e-Gov CKAN API を叩き、結合・重複排除・スコアフィルタ・日付降順ソートを行う。

const collectPolicyUpdates = async (sources: RssFeedSource[]): Promise<PolicyUpdate[]> => {
  const rssUpdates: PolicyUpdate[] = [];

  for (const source of sources) {
    const updates = await fetchSourceUpdates(source);
    rssUpdates.push(...updates);
    await sleep(INTER_REQUEST_DELAY_MS);
  }

  // RSS ソースとの連続アクセスを避けるため 2 秒待機する
  await sleep(2_000);

  let eGovUpdates: PolicyUpdate[] = [];
  try {
    const data = await fetchUrl(EGOV_API_URL, true);
    eGovUpdates = parseEGovResponse(data);
    console.log(`[scraper] e-Gov: ${eGovUpdates.length} 件取得`);
  } catch (error) {
    console.warn("[scraper] e-Gov取得をスキップします:", error instanceof Error ? error.message : String(error));
  }

  // e-Gov との連続アクセスを避けるため 2 秒待機する
  await sleep(2_000);

  let ciniiUpdates: PolicyUpdate[] = [];
  try {
    const data = await fetchUrl(CINII_API_URL, true);
    ciniiUpdates = parseCiniiResponse(data);
    console.log(`[scraper] CiNii: ${ciniiUpdates.length} 件取得`);
  } catch (error) {
    console.warn("[scraper] CiNii取得をスキップします:", error instanceof Error ? error.message : String(error));
  }

  // CiNii との連続アクセスを避けるため 2 秒待機する
  await sleep(2_000);

  const lawUpdates: PolicyUpdate[] = [];
  for (const lawName of TARGET_LAWS) {
    const item = await fetchLawV2(lawName);
    if (item !== null) {
      lawUpdates.push(item);
      console.log(`[scraper] 法令取得: "${lawName}"`);
    }
    await sleep(2_000);
  }
  console.log(`[scraper] e-Gov 法令 (v2): ${lawUpdates.length} 件取得`);

  const combined = [...rssUpdates, ...eGovUpdates, ...ciniiUpdates, ...lawUpdates].filter(isRelevantPolicy);
  const deduped = removeDuplicates(combined);
  const sorted = deduped.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  console.log(
    `[scraper] RSS: ${rssUpdates.length} 件, e-Gov: ${eGovUpdates.length} 件, CiNii: ${ciniiUpdates.length} 件, 法令: ${lawUpdates.length} 件 → 重複排除・ソート後: ${sorted.length} 件`,
  );
  return sorted;
};

// ─── Dataset Assembly & I/O ───────────────────────────────────────────────────

const buildDataset = (items: PolicyUpdate[]): PolicyDataset => ({
  generatedAt: new Date().toISOString(),
  itemCount: items.length,
  items,
});

// src/ から見て ../../../apps/frontend/public/data/latest.json が出力先
const getOutputPath = (): string => resolve(import.meta.dir, "../../../apps/frontend/public/data/latest.json");

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
