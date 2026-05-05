import { decodeResponseBody } from "./encoding.ts";

// ─── Network Constants ────────────────────────────────────────────────────────

export const SCRAPER_USER_AGENT = "AX-Compass-Bot/1.0";
export const RETRYABLE_STATUS_CODES = new Set([403, 503]);
export const MAX_RETRIES = 3;
export const BASE_RETRY_DELAY_MS = 800;
export const MAX_RETRY_DELAY_MS = 10_000;
export const INTER_REQUEST_DELAY_MS = 1_500;

// ─── Network Layer ────────────────────────────────────────────────────────────

export const createRequestInit = (): RequestInit => ({
  headers: {
    Accept:
      "application/rss+xml, application/atom+xml, application/rdf+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
    "User-Agent": SCRAPER_USER_AGENT,
  },
});

export const sleep = async (milliseconds: number): Promise<void> => {
  await Bun.sleep(milliseconds);
};

export const calculateBackoffDelay = (attempt: number): number =>
  Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);

export const isRetryableNetworkError = (error: unknown): boolean =>
  error instanceof Error && /(network|timed out|fetch failed|socket|connect|dns)/i.test(error.message);

export const fetchWithRetry = async (url: string): Promise<Response> => {
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

// JSON および XML レスポンスを統一的に取得するラッパー。
export const fetchUrl = async (url: string, isJson = false): Promise<unknown> => {
  const response = await fetchWithRetry(url);
  return isJson ? response.json() : decodeResponseBody(response);
};
