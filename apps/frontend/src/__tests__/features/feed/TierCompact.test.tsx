import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TierCompact } from "../../../features/feed/TierCompact";
import type { PolicyUpdate } from "../../../types";

const sampleItems: PolicyUpdate[] = [
  {
    id: "001",
    title: "DX推進ロードマップ",
    url: "https://example.go.jp/dx",
    publishedAt: "2025-05-01T00:00:00Z",
    source: "経済産業省",
    score: 3,
    tags: ["DX"],
  },
  {
    id: "002",
    title: "AI倫理指針の改定",
    url: "https://example.go.jp/ai-ethics",
    publishedAt: "2025-05-02T00:00:00Z",
    source: "内閣府",
    score: 2,
    tags: ["GOVERNANCE"],
  },
];

describe("TierCompact", () => {
  it("「Tier 3」バッジを表示する", () => {
    render(<TierCompact items={sampleItems} />);
    expect(screen.getByText("Tier 3")).toBeDefined();
  });

  it("section の aria-label が「周辺」である", () => {
    render(<TierCompact items={sampleItems} />);
    expect(screen.getByRole("region", { name: "周辺" })).toBeDefined();
  });

  it("各アイテムのタイトルをリンクとして表示する", () => {
    render(<TierCompact items={sampleItems} />);
    const link = screen.getByRole("link", { name: "DX推進ロードマップ" });
    expect(link.getAttribute("href")).toBe("https://example.go.jp/dx");
  });

  it("リンクが新しいタブで開く設定になっている", () => {
    render(<TierCompact items={sampleItems} />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }
  });

  it("各アイテムのソース名を表示する", () => {
    render(<TierCompact items={sampleItems} />);
    expect(screen.getByText("経済産業省")).toBeDefined();
    expect(screen.getByText("内閣府")).toBeDefined();
  });

  it("各アイテムの time 要素に publishedAt を dateTime 属性として持つ", () => {
    render(<TierCompact items={sampleItems} />);
    const times = document.querySelectorAll("time");
    const dateTimes = Array.from(times).map((t) => t.getAttribute("dateTime"));
    expect(dateTimes).toContain("2025-05-01T00:00:00Z");
    expect(dateTimes).toContain("2025-05-02T00:00:00Z");
  });

  it("複数アイテムをすべてレンダリングする", () => {
    render(<TierCompact items={sampleItems} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
