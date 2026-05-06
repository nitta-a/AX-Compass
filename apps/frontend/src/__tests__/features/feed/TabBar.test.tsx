import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { TabBar } from "../../../features/feed/TabBar";
import type { Tab } from "../../../lib/policy";

describe("TabBar", () => {
  it("すべてのタブボタンを表示する", () => {
    render(<TabBar activeTab="ALL" onTabChange={() => {}} />);
    expect(screen.getByRole("button", { name: "すべて" })).toBeDefined();
    expect(screen.getByRole("button", { name: "AI コア" })).toBeDefined();
    expect(screen.getByRole("button", { name: "ガバナンス" })).toBeDefined();
  });

  it("activeTab に対応するボタンに active クラスが付く", () => {
    render(<TabBar activeTab="AI_CORE" onTabChange={() => {}} />);
    const btn = screen.getByRole("button", { name: "AI コア" });
    expect(btn.className).toContain("tab-bar__btn--active");
  });

  it("非 activeTab のボタンに active クラスが付かない", () => {
    render(<TabBar activeTab="ALL" onTabChange={() => {}} />);
    const btn = screen.getByRole("button", { name: "AI コア" });
    expect(btn.className).not.toContain("tab-bar__btn--active");
  });

  it("ボタンをクリックすると onTabChange が対応する Tab 値で呼ばれる", () => {
    let received: Tab | undefined;
    render(
      <TabBar
        activeTab="ALL"
        onTabChange={(t) => {
          received = t;
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ガバナンス" }));
    expect(received).toBe("GOVERNANCE");
  });

  it("activeTab ボタンの aria-pressed が true になる", () => {
    render(<TabBar activeTab="GOVERNANCE" onTabChange={() => {}} />);
    const btn = screen.getByRole("button", { name: "ガバナンス" });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("非 activeTab ボタンの aria-pressed が false になる", () => {
    render(<TabBar activeTab="ALL" onTabChange={() => {}} />);
    const btn = screen.getByRole("button", { name: "AI コア" });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("nav 要素が「カテゴリ絞り込み」のアクセシビリティラベルを持つ", () => {
    render(<TabBar activeTab="ALL" onTabChange={() => {}} />);
    expect(
      screen.getByRole("navigation", { name: "カテゴリ絞り込み" }),
    ).toBeDefined();
  });
});
