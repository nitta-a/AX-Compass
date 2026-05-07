import type { KeywordRule, PolicyUpdate } from "./types.ts";

// ─── Keyword Scoring ─────────────────────────────────────────────────────────
// タイトルに含まれるキーワードに基づきスコアとカテゴリタグを算出する純粋関数群。
// score > 0 のアイテムのみを最終データセットに含める。
// キーワードは大文字小文字を区別して比較する（"AI" と "ai" を区別するため）。

export const KEYWORD_RULES: readonly KeywordRule[] = [
  // AI_CORE: AI 技術そのものに関する用語（高スコア）
  { word: "AI", weight: 10, category: "AI_CORE" },
  { word: "生成AI", weight: 10, category: "AI_CORE" },
  { word: "LLM", weight: 10, category: "AI_CORE" },
  { word: "人工知能", weight: 10, category: "AI_CORE" },
  { word: "機械学習", weight: 10, category: "AI_CORE" },
  { word: "ディープラーニング", weight: 8, category: "AI_CORE" },
  { word: "深層学習", weight: 8, category: "AI_CORE" },
  { word: "大規模言語モデル", weight: 10, category: "AI_CORE" },
  { word: "プロンプト", weight: 6, category: "AI_CORE" },
  { word: "アルゴリズム", weight: 4, category: "AI_CORE" },
  // GOVERNANCE: 政策・法制度に関する用語（中スコア）
  { word: "ガイドライン", weight: 5, category: "GOVERNANCE" },
  { word: "ガバナンス", weight: 5, category: "GOVERNANCE" },
  { word: "著作権", weight: 4, category: "GOVERNANCE" },
  { word: "個人情報", weight: 4, category: "GOVERNANCE" },
  { word: "プライバシー", weight: 4, category: "GOVERNANCE" },
  { word: "規制改革", weight: 3, category: "GOVERNANCE" },
  { word: "情報セキュリティ", weight: 4, category: "GOVERNANCE" },
  { word: "サイバーセキュリティ", weight: 4, category: "GOVERNANCE" },
  { word: "倫理", weight: 3, category: "GOVERNANCE" },
  // CONTEXT: DX・行政デジタル化に関する用語（低スコア）
  { word: "AX", weight: 3, category: "CONTEXT" },
  { word: "DX", weight: 2, category: "CONTEXT" },
  { word: "デジタルトランスフォーメーション", weight: 2, category: "CONTEXT" },
  { word: "デジタル化", weight: 2, category: "CONTEXT" },
  { word: "デジタル庁", weight: 2, category: "CONTEXT" },
  { word: "ガバメントクラウド", weight: 2, category: "CONTEXT" },
  { word: "マイナンバー", weight: 1, category: "CONTEXT" },
  { word: "データ連携", weight: 2, category: "CONTEXT" },
  { word: "データ戦略", weight: 2, category: "CONTEXT" },
  { word: "自動化", weight: 1, category: "CONTEXT" },
  { word: "クラウド", weight: 1, category: "CONTEXT" },
  // GOVERNANCE: DSS・スキル標準関連の用語
  { word: "デジタルスキル標準", weight: 8, category: "GOVERNANCE" },
  { word: "DX推進スキル標準", weight: 8, category: "GOVERNANCE" },
  { word: "スキル標準", weight: 5, category: "GOVERNANCE" },
  // CONTEXT: リスキリング・IT人材関連の用語
  { word: "リスキリング", weight: 5, category: "CONTEXT" },
  { word: "IT人材", weight: 4, category: "CONTEXT" },
  { word: "DSS", weight: 4, category: "CONTEXT" },
  // CONTEXT: 教育・医療・金融分野の用語
  { word: "教育", weight: 3, category: "CONTEXT" },
  { word: "大学", weight: 2, category: "CONTEXT" },
  { word: "医療", weight: 3, category: "CONTEXT" },
  { word: "創薬", weight: 4, category: "CONTEXT" },
  { word: "金融", weight: 3, category: "CONTEXT" },
  { word: "銀行", weight: 2, category: "CONTEXT" },
  // GOVERNANCE: セキュリティ・脆弱性関連の用語
  { word: "脆弱性", weight: 3, category: "GOVERNANCE" },
  { word: "セキュリティ", weight: 3, category: "GOVERNANCE" },
  // CONTEXT: インシデント対応関連の用語
  { word: "インシデント", weight: 2, category: "CONTEXT" },
];

export interface ScoreResult {
  score: number;
  tags: string[];
}

// 単一テキストに対してスコアと一致カテゴリの配列を返す純粋関数。
// 同一カテゴリのキーワードが複数マッチしても重複タグは生成しない。
export const computeScoreAndTags = (text: string, rules: readonly KeywordRule[]): ScoreResult => {
  let score = 0;
  const matchedCategories = new Set<KeywordRule["category"]>();

  for (const rule of rules) {
    if (text.includes(rule.word)) {
      score += rule.weight;
      matchedCategories.add(rule.category);
    }
  }

  return { score, tags: [...matchedCategories] };
};

// score が 0 より大きいアイテムのみを関連情報として扱う。
export const isRelevantPolicy = (item: PolicyUpdate): boolean => item.score > 0;
