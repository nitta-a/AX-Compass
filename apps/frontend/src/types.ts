export interface PolicyUpdate {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  score: number;
  tags: string[];
}

export interface PolicyDataset {
  generatedAt: string;
  itemCount: number;
  items: PolicyUpdate[];
}
