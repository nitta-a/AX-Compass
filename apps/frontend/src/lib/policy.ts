import type { PolicyUpdate } from "../types";

// ─── Tab type ────────────────────────────────────────────────────────────────

export type Tab = "ALL" | "AI_CORE" | "GOVERNANCE";

export interface Tiers {
  tier1: PolicyUpdate[];
  tier2: PolicyUpdate[];
  tier3: PolicyUpdate[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const TABS: Tab[] = ["ALL", "AI_CORE", "GOVERNANCE"];

export const TAB_LABELS: Record<Tab, string> = {
  ALL: "すべて",
  AI_CORE: "AI コア",
  GOVERNANCE: "ガバナンス",
};

// ─── Pure functions ──────────────────────────────────────────────────────────

export const filterByTab = (items: PolicyUpdate[], tab: Tab): PolicyUpdate[] => {
  if (tab === "ALL") return items;
  return items.filter((item) => item.tags.includes(tab));
};

export const filterBySearch = (items: PolicyUpdate[], query: string): PolicyUpdate[] => {
  if (query === "") return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.source.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
};

export const categorizeByTier = (items: PolicyUpdate[]): Tiers => {
  const tier1: PolicyUpdate[] = [];
  const tier2: PolicyUpdate[] = [];
  const tier3: PolicyUpdate[] = [];

  for (const item of items) {
    if (item.score >= 10) {
      tier1.push(item);
    } else if (item.score >= 5) {
      tier2.push(item);
    } else {
      tier3.push(item);
    }
  }

  return { tier1, tier2, tier3 };
};
