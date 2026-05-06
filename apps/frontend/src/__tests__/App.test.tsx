import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { App } from "../App";

const validDataset = {
  generatedAt: "2025-04-01T12:00:00Z",
  itemCount: 2,
  items: [
    {
      id: "001",
      title: "AI政策アップデート",
      url: "https://example.go.jp/1",
      publishedAt: "2025-04-01T00:00:00Z",
      source: "デジタル庁",
      score: 90,
      tags: ["AI"],
    },
    {
      id: "002",
      title: "DX推進ガイドライン改定",
      url: "https://example.go.jp/2",
      publishedAt: "2025-04-02T00:00:00Z",
      source: "経済産業省",
      score: 85,
      tags: ["DX"],
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

describe("App", () => {
  it("データ取得中はローディングメッセージを表示する", () => {
    // fetch を永続的な Pending 状態にすることで isLoading: true を維持する
    globalThis.fetch = (() => new Promise(() => {})) as unknown as typeof globalThis.fetch;
    render(<App />);
    expect(screen.getByText("データを読み込んでいます。")).toBeDefined();
  });

  it("データ取得成功後にフィードカードを表示する", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => validDataset,
      }) as Response) as unknown as typeof globalThis.fetch;

    render(<App />);

    // 非同期でデータが反映されるまで待つ
    await screen.findByText("AI政策アップデート");
    expect(screen.getByText("DX推進ガイドライン改定")).toBeDefined();
  });

  it("データ取得成功後にローディングメッセージが消える", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => validDataset,
      }) as Response) as unknown as typeof globalThis.fetch;

    render(<App />);

    await screen.findByText("AI政策アップデート");
    expect(screen.queryByText("データを読み込んでいます。")).toBeNull();
  });

  it("データ取得失敗時に HTTP status を含むエラーメッセージを表示する", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: false,
        status: 503,
        json: async () => ({}),
      }) as Response) as unknown as typeof globalThis.fetch;

    render(<App />);

    await screen.findByText(/503/);
  });

  it("データ取得成功後に HeroPanel の itemCount を表示する", async () => {
    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => validDataset,
      }) as Response) as unknown as typeof globalThis.fetch;

    render(<App />);

    await screen.findByText("AI政策アップデート");
    expect(screen.getByText("2")).toBeDefined();
  });
});
