import { describe, expect, it } from "bun:test";
import { isPolicyDataset, isPolicyUpdate } from "../../lib/guards";

const validUpdate = {
  id: "001",
  title: "AI戦略2030について",
  url: "https://example.go.jp/1",
  publishedAt: "2025-01-01T00:00:00Z",
  source: "デジタル庁",
  score: 90,
  tags: ["AI", "DX"],
};

const validDataset = {
  generatedAt: "2025-01-01T12:00:00Z",
  itemCount: 1,
  items: [validUpdate],
};

describe("isPolicyUpdate", () => {
  it("有効なオブジェクトを受け入れる", () => {
    expect(isPolicyUpdate(validUpdate)).toBe(true);
  });

  it("null を拒否する", () => {
    expect(isPolicyUpdate(null)).toBe(false);
  });

  it("プリミティブ値を拒否する", () => {
    expect(isPolicyUpdate("string")).toBe(false);
    expect(isPolicyUpdate(42)).toBe(false);
  });

  it("id フィールドが欠落している場合を拒否する", () => {
    const { id: _id, ...withoutId } = validUpdate;
    expect(isPolicyUpdate(withoutId)).toBe(false);
  });

  it("score が数値でない場合を拒否する", () => {
    expect(isPolicyUpdate({ ...validUpdate, score: "90" })).toBe(false);
  });

  it("tags が配列でない場合を拒否する", () => {
    expect(isPolicyUpdate({ ...validUpdate, tags: "AI" })).toBe(false);
  });

  it("url が欠落している場合を拒否する", () => {
    const { url: _url, ...withoutUrl } = validUpdate;
    expect(isPolicyUpdate(withoutUrl)).toBe(false);
  });

  it("publishedAt が欠落している場合を拒否する", () => {
    const { publishedAt: _p, ...withoutPublishedAt } = validUpdate;
    expect(isPolicyUpdate(withoutPublishedAt)).toBe(false);
  });
});

describe("isPolicyDataset", () => {
  it("有効なオブジェクトを受け入れる", () => {
    expect(isPolicyDataset(validDataset)).toBe(true);
  });

  it("null を拒否する", () => {
    expect(isPolicyDataset(null)).toBe(false);
  });

  it("generatedAt が欠落している場合を拒否する", () => {
    const { generatedAt: _g, ...rest } = validDataset;
    expect(isPolicyDataset(rest)).toBe(false);
  });

  it("itemCount が数値でない場合を拒否する", () => {
    expect(isPolicyDataset({ ...validDataset, itemCount: "1" })).toBe(false);
  });

  it("items が配列でない場合を拒否する", () => {
    expect(isPolicyDataset({ ...validDataset, items: null })).toBe(false);
  });

  it("items に無効な要素が含まれる場合を拒否する", () => {
    expect(isPolicyDataset({ ...validDataset, items: [{ id: 1 }] })).toBe(false);
  });

  it("items が空配列でも受け入れる", () => {
    expect(isPolicyDataset({ ...validDataset, items: [], itemCount: 0 })).toBe(true);
  });
});
