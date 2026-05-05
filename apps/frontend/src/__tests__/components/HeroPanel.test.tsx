import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { HeroPanel } from "../../components/HeroPanel";
import type { PolicyDataset } from "../../types";

const sampleDataset: PolicyDataset = {
  generatedAt: "2025-04-01T12:00:00Z",
  itemCount: 5,
  items: [],
};

describe("HeroPanel", () => {
  it("サービス名「AX Compass」を表示する", () => {
    render(<HeroPanel dataset={null} />);
    expect(screen.getByText("AX Compass")).toBeDefined();
  });

  it("メインの h1 見出しを表示する", () => {
    render(<HeroPanel dataset={null} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("dataset が null の場合メトリクスを表示しない", () => {
    render(<HeroPanel dataset={null} />);
    expect(screen.queryByText("生成時刻")).toBeNull();
    expect(screen.queryByText("件数")).toBeNull();
  });

  it("dataset が渡された場合「生成時刻」と「件数」を表示する", () => {
    render(<HeroPanel dataset={sampleDataset} />);
    expect(screen.getByText("生成時刻")).toBeDefined();
    expect(screen.getByText("件数")).toBeDefined();
  });

  it("dataset が渡された場合 itemCount を表示する", () => {
    render(<HeroPanel dataset={sampleDataset} />);
    expect(screen.getByText("5")).toBeDefined();
  });
});
