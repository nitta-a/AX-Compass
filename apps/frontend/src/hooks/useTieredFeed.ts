import { useState } from "react";
import type { Tab, Tiers } from "../lib/policy";
import { categorizeByTier, filterBySearch, filterByTab } from "../lib/policy";
import type { PolicyUpdate } from "../types";

interface Props {
  items: PolicyUpdate[];
  searchQuery: string;
}
interface UseTieredFeedResult {
  tab: Tab;
  setTab: (tab: Tab) => void;
  tiers: Tiers;
  filteredCount: number;
}

export const useTieredFeed = (props: Props): UseTieredFeedResult => {
  const { items, searchQuery } = props;
  const [tab, setTab] = useState<Tab>("ALL");

  const byTab = filterByTab(items, tab);
  const bySearch = filterBySearch(byTab, searchQuery);
  const tiers = categorizeByTier(bySearch);

  return { tab, setTab, tiers, filteredCount: bySearch.length };
};
