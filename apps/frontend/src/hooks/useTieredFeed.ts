import { useMemo, useState } from "react";
import { categorizeByTier, filterByTab } from "../lib/policy";
import type { Tab, Tiers } from "../lib/policy";
import type { PolicyUpdate } from "../types";

interface UseTieredFeedResult {
  tab: Tab;
  setTab: (tab: Tab) => void;
  tiers: Tiers;
  filteredCount: number;
}

export const useTieredFeed = (items: PolicyUpdate[]): UseTieredFeedResult => {
  const [tab, setTab] = useState<Tab>("ALL");

  const filtered = useMemo(() => filterByTab(items, tab), [items, tab]);
  const tiers = useMemo(() => categorizeByTier(filtered), [filtered]);

  return { tab, setTab, tiers, filteredCount: filtered.length };
};
