import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TierGrid } from "../../../features/feed/TierGrid";
import type { PolicyUpdate } from "../../../types";

const sampleItems: PolicyUpdate[] = [
  {
    id: "001",
    title: "AIガバナンスフレームワーク",
    url: "https://example.go.jp/ai-gov",
    publishedAt: "2025-06-01T00:00:00Z",
    source: "デジタル庁",
    score: 7,
    tags: ["AI_CORE", "GOVERNANCE"],
  },
  {
    id: "002",
    title: "データ利活用推進方針",
    url: "https://example.go.jp/data",
    publishedAt: "2025-06-02T00:00:00Z",
    source: "総務省",
    score: 6,
    tags: ["DX"],
  },
];

describe("TierGrid", () => {
  it("「Tier 2」バッジを表示する", () => {
    render(<TierGrid items={sampleItems} />);
    expect(screen.getByText("Tier 2")).toBeDefined();
  });

  it("section の aria-label が「標準」である", () => {
    render(<TierGrid items={sampleItems} />);
    expect(screen.getByRole("region", { name: "標準" })).toBeDefined();
  });

  it("アイテムのタイトルをリンクとして表示する", () => {
    render(<TierGrid items={sampleItems} />);
    const link = screen.getByRole("link", {
      name: "AIガバナンスフレームワーク",
    });
    expect(link.getAttribute("href")).toBe("https://example.go.jp/ai-gov");
  });

  it("リンクが新しいタブで開く設定になっている", () => {
    render(<TierGrid items={sampleItems} />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }
  });

  it("ソース名を表示する", () => {
    render(<TierGrid items={sampleItems} />);
    expect(screen.getByText("デジタル庁")).toBeDefined();
    expect(screen.getByText("総務省")).toBeDefined();
  });

  it("スコアを表示する", () => {
    render(<TierGrid items={sampleItems} />);
    expect(screen.getByText("スコア 7")).toBeDefined();
    expect(screen.getByText("スコア 6")).toBeDefined();
  });

  it("タグを表示する", () => {
    render(<TierGrid items={sampleItems} />);
    expect(screen.getByText("AI_CORE")).toBeDefined();
    expect(screen.getByText("GOVERNANCE")).toBeDefined();
    expect(screen.getByText("DX")).toBeDefined();
  });

  it("各アイテムの time 要素に publishedAt を dateTime 属性として持つ", () => {
    render(<TierGrid items={sampleItems} />);
    const times = document.querySelectorAll("time");
    const dateTimes = Array.from(times).map((t) => t.getAttribute("dateTime"));
    expect(dateTimes).toContain("2025-06-01T00:00:00Z");
    expect(dateTimes).toContain("2025-06-02T00:00:00Z");
  });

  it("複数アイテムをすべてレンダリングする", () => {
    render(<TierGrid items={sampleItems} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
