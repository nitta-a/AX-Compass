import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TierHero } from "../../../features/feed/TierHero";
import type { PolicyUpdate } from "../../../types";

const sampleItems: PolicyUpdate[] = [
  {
    id: "001",
    title: "AI基本法 閣議決定",
    url: "https://example.go.jp/ai-law",
    publishedAt: "2025-07-01T00:00:00Z",
    source: "内閣官房",
    score: 15,
    tags: ["AI_CORE"],
  },
  {
    id: "002",
    title: "デジタル社会形成基本計画 改定",
    url: "https://example.go.jp/digital-plan",
    publishedAt: "2025-07-02T00:00:00Z",
    source: "デジタル庁",
    score: 12,
    tags: ["GOVERNANCE", "DX"],
  },
];

describe("TierHero", () => {
  it("「Tier 1」バッジを表示する", () => {
    render(<TierHero items={sampleItems} />);
    expect(screen.getByText("Tier 1")).toBeDefined();
  });

  it("section の aria-label が「重要」である", () => {
    render(<TierHero items={sampleItems} />);
    expect(screen.getByRole("region", { name: "重要" })).toBeDefined();
  });

  it("アイテムのタイトルをリンクとして表示する", () => {
    render(<TierHero items={sampleItems} />);
    const link = screen.getByRole("link", { name: "AI基本法 閣議決定" });
    expect(link.getAttribute("href")).toBe("https://example.go.jp/ai-law");
  });

  it("リンクが新しいタブで開く設定になっている", () => {
    render(<TierHero items={sampleItems} />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }
  });

  it("ソース名を表示する", () => {
    render(<TierHero items={sampleItems} />);
    expect(screen.getByText("内閣官房")).toBeDefined();
    expect(screen.getByText("デジタル庁")).toBeDefined();
  });

  it("スコアを表示する", () => {
    render(<TierHero items={sampleItems} />);
    expect(screen.getByText("スコア 15")).toBeDefined();
    expect(screen.getByText("スコア 12")).toBeDefined();
  });

  it("タグを表示する", () => {
    render(<TierHero items={sampleItems} />);
    expect(screen.getByText("AI_CORE")).toBeDefined();
    expect(screen.getByText("GOVERNANCE")).toBeDefined();
    expect(screen.getByText("DX")).toBeDefined();
  });

  it("各アイテムの time 要素に publishedAt を dateTime 属性として持つ", () => {
    render(<TierHero items={sampleItems} />);
    const times = document.querySelectorAll("time");
    const dateTimes = Array.from(times).map((t) => t.getAttribute("dateTime"));
    expect(dateTimes).toContain("2025-07-01T00:00:00Z");
    expect(dateTimes).toContain("2025-07-02T00:00:00Z");
  });

  it("複数アイテムをすべてレンダリングする", () => {
    render(<TierHero items={sampleItems} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
