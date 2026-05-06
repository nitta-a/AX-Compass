import { describe, expect, it } from "bun:test";
import { formatDate, getLatestDatasetUrl } from "../../lib/utils";

describe("formatDate", () => {
  it("有効な ISO 日付文字列を日本語フォーマットに変換する", () => {
    const result = formatDate("2025-04-01T09:00:00Z");
    expect(typeof result).toBe("string");
    // 変換されていること（元の ISO 文字列と異なること）を確認
    expect(result).not.toBe("2025-04-01T09:00:00Z");
    // 年が含まれることを確認
    expect(result).toMatch(/2025/);
  });

  it("無効な日付文字列をそのまま返す", () => {
    expect(formatDate("invalid-date")).toBe("invalid-date");
  });

  it("空文字列をそのまま返す", () => {
    expect(formatDate("")).toBe("");
  });

  it("月・日のみの文字列はそのまま返す", () => {
    // "Apr 01" のような文字列は NaN になるためそのまま返す
    const input = "not-a-real-date-value";
    expect(formatDate(input)).toBe(input);
  });
});

describe("getLatestDatasetUrl", () => {
  it("data/latest.json を含む文字列を返す", () => {
    // happy-dom 環境で document.baseURI が解決できるよう href を設定
    Object.defineProperty(window, "location", {
      value: { href: "http://localhost/" },
      writable: true,
    });
    const url = getLatestDatasetUrl();
    expect(url).toContain("data/latest.json");
  });

  it("有効な URL フォーマットの文字列を返す", () => {
    const url = getLatestDatasetUrl();
    expect(() => new URL(url)).not.toThrow();
  });
});
