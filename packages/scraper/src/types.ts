// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeywordRule {
  word: string;
  weight: number;
  category: "AI_CORE" | "GOVERNANCE" | "CONTEXT";
}

export interface PolicyUpdate {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  score: number;
  tags: string[];
  summary?: string;
}

export interface PolicyDataset {
  generatedAt: string;
  itemCount: number;
  items: PolicyUpdate[];
}

export interface RssFeedSource {
  sourceName: string;
  url: string;
}
