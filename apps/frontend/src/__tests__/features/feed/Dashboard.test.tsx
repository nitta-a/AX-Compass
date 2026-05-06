import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Dashboard } from "../../../features/feed/Dashboard";
import type { PolicyUpdate } from "../../../types";

const makeItem = (overrides: Partial<PolicyUpdate> = {}): PolicyUpdate => ({
  id: "001",
  title: "AI政策ニュース",
  url: "https://example.go.jp/news",
  publishedAt: "2025-04-01T00:00:00Z",
  source: "デジタル庁",
  score: 12,
  tags: ["AI_CORE"],
  ...overrides,
});

describe("Dashboard", () => {
  it("items が空のとき「このカテゴリの情報はありません。」を表示する", () => {
    render(<Dashboard items={[]} generatedAt="" />);
    expect(screen.getByText("このカテゴリの情報はありません。")).toBeDefined();
  });

  it("items があるとき「件数」ラベルと件数を表示する", () => {
    render(
      <Dashboard
        items={[makeItem(), makeItem({ id: "002", title: "別ニュース" })]}
        generatedAt=""
      />,
    );
    expect(screen.getByText("件数")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
  });

  it("generatedAt があるとき「更新」ラベルを表示する", () => {
    render(
      <Dashboard items={[makeItem()]} generatedAt="2025-04-01T12:00:00Z" />,
    );
    expect(screen.getByText("更新")).toBeDefined();
  });

  it("generatedAt が空文字のとき「更新」ラベルを表示しない", () => {
    render(<Dashboard items={[makeItem()]} generatedAt="" />);
    expect(screen.queryByText("更新")).toBeNull();
  });

  it("検索ボックスが存在する", () => {
    render(<Dashboard items={[makeItem()]} generatedAt="" />);
    expect(
      screen.getByPlaceholderText("キーワードや省庁名で検索..."),
    ).toBeDefined();
  });

  it("検索クエリに一致するアイテムのみ表示される", () => {
    const items = [
      makeItem({ id: "001", title: "AI基本法 閣議決定", source: "内閣官房" }),
      makeItem({ id: "002", title: "DX推進計画", source: "デジタル庁" }),
    ];
    render(<Dashboard items={items} generatedAt="" />);
    fireEvent.change(
      screen.getByPlaceholderText("キーワードや省庁名で検索..."),
      {
        target: { value: "AI基本法" },
      },
    );
    expect(screen.getByText("AI基本法 閣議決定")).toBeDefined();
    expect(screen.queryByText("DX推進計画")).toBeNull();
  });

  it("ソース名で検索できる", () => {
    const items = [
      makeItem({ id: "001", title: "AI基本法 閣議決定", source: "内閣官房" }),
      makeItem({ id: "002", title: "DX推進計画", source: "デジタル庁" }),
    ];
    render(<Dashboard items={items} generatedAt="" />);
    fireEvent.change(
      screen.getByPlaceholderText("キーワードや省庁名で検索..."),
      {
        target: { value: "内閣官房" },
      },
    );
    expect(screen.getByText("AI基本法 閣議決定")).toBeDefined();
    expect(screen.queryByText("DX推進計画")).toBeNull();
  });

  it("検索クエリをクリアすると全アイテムが表示される", () => {
    const items = [
      makeItem({ id: "001", title: "AI基本法 閣議決定" }),
      makeItem({ id: "002", title: "DX推進計画" }),
    ];
    render(<Dashboard items={items} generatedAt="" />);
    const searchInput =
      screen.getByPlaceholderText("キーワードや省庁名で検索...");
    fireEvent.change(searchInput, { target: { value: "AI" } });
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("AI基本法 閣議決定")).toBeDefined();
    expect(screen.getByText("DX推進計画")).toBeDefined();
  });

  it("検索で全件絞り込まれると「このカテゴリの情報はありません。」を表示する", () => {
    render(<Dashboard items={[makeItem()]} generatedAt="" />);
    fireEvent.change(
      screen.getByPlaceholderText("キーワードや省庁名で検索..."),
      {
        target: { value: "存在しないキーワード" },
      },
    );
    expect(screen.getByText("このカテゴリの情報はありません。")).toBeDefined();
  });
});
