import { useState } from "react";
import type { Tab, Tiers } from "../lib/policy";
import { categorizeByTier, filterByTab } from "../lib/policy";
import type { PolicyUpdate } from "../types";

interface UseTieredFeedResult {
  tab: Tab;
  setTab: (tab: Tab) => void;
  tiers: Tiers;
  filteredCount: number;
}

export const useTieredFeed = (items: PolicyUpdate[]): UseTieredFeedResult => {
  const [tab, setTab] = useState<Tab>("ALL");

  const filtered = filterByTab(items, tab);
  const tiers = categorizeByTier(filtered);

  return { tab, setTab, tiers, filteredCount: filtered.length };
};
