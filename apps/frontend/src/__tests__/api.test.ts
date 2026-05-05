import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { fetchPolicyDataset } from "../api";

const validDataset = {
  generatedAt: "2025-01-01T12:00:00Z",
  itemCount: 1,
  items: [
    {
      id: "001",
      title: "テスト記事",
      url: "https://example.go.jp/1",
      publishedAt: "2025-01-01T00:00:00Z",
      source: "デジタル庁",
      score: 90,
      tags: ["AI"],
    },
  ],
};

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("fetchPolicyDataset", () => {
  it("有効なレスポンスを PolicyDataset として返す", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => validDataset,
      }) as Response) as unknown as typeof globalThis.fetch;

    const result = await fetchPolicyDataset("https://example.com/latest.json");
    expect(result).toEqual(validDataset);
  });

  it("HTTP 404 エラー時に status を含む例外を投げる", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: false,
        status: 404,
        json: async () => ({}),
      }) as Response) as unknown as typeof globalThis.fetch;

    await expect(fetchPolicyDataset("https://example.com/latest.json")).rejects.toThrow("404");
  });

  it("HTTP 503 エラー時に status を含む例外を投げる", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: false,
        status: 503,
        json: async () => ({}),
      }) as Response) as unknown as typeof globalThis.fetch;

    await expect(fetchPolicyDataset("https://example.com/latest.json")).rejects.toThrow("503");
  });

  it("スキーマが不正な場合に例外を投げる", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({ unexpected: true }),
      }) as Response) as unknown as typeof globalThis.fetch;

    await expect(fetchPolicyDataset("https://example.com/latest.json")).rejects.toThrow("unexpected schema");
  });

  it("items が欠落したレスポンスを拒否する", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => ({ generatedAt: "2025-01-01", itemCount: 0 }),
      }) as Response) as unknown as typeof globalThis.fetch;

    await expect(fetchPolicyDataset("https://example.com/latest.json")).rejects.toThrow("unexpected schema");
  });
});
