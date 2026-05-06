import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { FeedCard } from "../../features/feed/FeedCard";
import type { PolicyUpdate } from "../../types";

const sampleItem: PolicyUpdate = {
  id: "001",
  title: "AI戦略2030 公開",
  url: "https://example.go.jp/ai-strategy",
  publishedAt: "2025-04-01T09:00:00Z",
  source: "デジタル庁",
  score: 95,
  tags: ["AI", "戦略"],
};

describe("FeedCard", () => {
  it("タイトルを表示する", () => {
    render(<FeedCard item={sampleItem} />);
    expect(screen.getByText("AI戦略2030 公開")).toBeDefined();
  });

  it("ソース名を表示する", () => {
    render(<FeedCard item={sampleItem} />);
    expect(screen.getByText("デジタル庁")).toBeDefined();
  });

  it("参照元リンクが正しい href を持つ", () => {
    render(<FeedCard item={sampleItem} />);
    const link = screen.getByRole("link", { name: "参照元を見る" });
    expect(link.getAttribute("href")).toBe("https://example.go.jp/ai-strategy");
  });

  it("リンクが新しいタブで開く設定になっている", () => {
    render(<FeedCard item={sampleItem} />);
    const link = screen.getByRole("link", { name: "参照元を見る" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });

  it("time 要素に publishedAt を dateTime 属性として持つ", () => {
    render(<FeedCard item={sampleItem} />);
    const time = document.querySelector("time");
    expect(time?.getAttribute("dateTime")).toBe("2025-04-01T09:00:00Z");
  });

  it("li 要素としてレンダリングされる", () => {
    render(<FeedCard item={sampleItem} />);
    expect(screen.getByRole("listitem")).toBeDefined();
  });
});
