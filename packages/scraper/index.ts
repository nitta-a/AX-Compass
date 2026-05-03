import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

interface SourceConfig {
  id: string;
  title: string;
  url: string;
  topic: string;
}

interface RawRecord {
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
};

interface CompassEntry {
  id: string;
  sourceId: string;
  sourceTitle: string;
  topic: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
};

interface CompassDataset {
  generatedAt: string;
  itemCount: number;
  items: CompassEntry[];
};

const scraperUserAgent = "AX-Compass-Bot/1.0";
const retryableStatusCodes = new Set([403, 503]);
const sources: SourceConfig[] = [
  {
    id: "egov-rss",
    title: "e-Gov Dummy RSS",
    url: "https://dummy-egov-api.example.com/rss",
    topic: "policy",
  },
  {
    id: "digital-agency-news",
    title: "Digital Agency Dummy Feed",
    url: "https://dummy-egov-api.example.com/digital-agency",
    topic: "governance",
  },
];

const createRequestInit = (): RequestInit => ({
  headers: {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    "User-Agent": scraperUserAgent,
  },
});

const isRetryableNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /(network|timed out|fetch failed|socket|connect|dns)/i.test(
    error.message,
  );
};

const calculateBackoffDelay = (attempt: number): number => {
  const baseDelayMs = 600;
  const maxDelayMs = 5_000;

  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
};

const sleep = async (milliseconds: number): Promise<void> => {
  await Bun.sleep(milliseconds);
};

const fetchWithRetry = async (
  url: string,
  maxRetries = 3,
): Promise<Response> => {
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, createRequestInit());

      if (
        !response.ok &&
        retryableStatusCodes.has(response.status) &&
        attempt < maxRetries
      ) {
        await sleep(calculateBackoffDelay(attempt));
        attempt += 1;
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status} for ${url}`,
        );
      }

      return response;
    } catch (error) {
      if (attempt >= maxRetries || !isRetryableNetworkError(error)) {
        throw error;
      }

      await sleep(calculateBackoffDelay(attempt));
      attempt += 1;
    }
  }
};

const createFallbackRecords = (source: SourceConfig): RawRecord[] => {
  const now = new Date().toISOString();

  return [
    {
      title: `${source.title} update`,
      summary: `${source.title} から取得した想定のダミー更新です。実運用では API レスポンスをここで正規化します。`,
      link: source.url,
      publishedAt: now,
    },
  ];
};

const isRawRecord = (value: unknown): value is RawRecord => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.link === "string" &&
    typeof candidate.publishedAt === "string"
  );
};

const parseRawRecords = (payload: unknown): RawRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRawRecord);
  }

  if (typeof payload === "object" && payload !== null) {
    const items = (payload as Record<string, unknown>).items;

    if (Array.isArray(items)) {
      return items.filter(isRawRecord);
    }
  }

  return [];
};

const fetchSourceRecords = async (
  source: SourceConfig,
): Promise<RawRecord[]> => {
  try {
    const response = await fetchWithRetry(source.url);
    const payload = (await response.json()) as unknown;
    const records = parseRawRecords(payload);

    return records.length > 0 ? records : createFallbackRecords(source);
  } catch {
    return createFallbackRecords(source);
  }
};

const toCompassEntries = (
  source: SourceConfig,
  fetchedAt: string,
  records: RawRecord[],
): CompassEntry[] => {
  return records.map((record, index) => ({
    id: `${source.id}-${index + 1}`,
    sourceId: source.id,
    sourceTitle: source.title,
    topic: source.topic,
    title: record.title,
    summary: record.summary,
    url: record.link,
    publishedAt: record.publishedAt,
    fetchedAt,
  }));
};

const collectEntries = async (
  inputSources: SourceConfig[],
): Promise<CompassEntry[]> => {
  const collectedEntries: CompassEntry[] = [];

  for (const source of inputSources) {
    const fetchedAt = new Date().toISOString();
    const records = await fetchSourceRecords(source);
    collectedEntries.push(...toCompassEntries(source, fetchedAt, records));
    await sleep(1_000);
  }

  return collectedEntries;
};

const buildDataset = (items: CompassEntry[]): CompassDataset => ({
  generatedAt: new Date().toISOString(),
  itemCount: items.length,
  items,
});

const getOutputPath = (): string => {
  return resolve(
    import.meta.dir,
    "../../apps/frontend/public/data/latest.json",
  );
};

const writeDataset = async (
  dataset: CompassDataset,
  outputPath: string,
): Promise<void> => {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8");
};

export const generateLatestDataset = async (): Promise<CompassDataset> => {
  const items = await collectEntries(sources);

  return buildDataset(items);
};

export const writeLatestDataset = async (): Promise<string> => {
  const dataset = await generateLatestDataset();
  const outputPath = getOutputPath();

  await writeDataset(dataset, outputPath);

  return outputPath;
};

const run = async (): Promise<void> => {
  const outputPath = await writeLatestDataset();
  console.log(`Generated dataset at ${outputPath}`);
};

await run();
