import type { KeywordRule, PolicyUpdate } from "./types.ts";

// ─── Keyword Scoring ─────────────────────────────────────────────────────────
// タイトルに含まれるキーワードに基づきスコアとカテゴリタグを算出する純粋関数群。
// score > 0 のアイテムのみを最終データセットに含める。
// キーワードは大文字小文字を区別して比較する（"AI" と "ai" を区別するため）。

export const KEYWORD_RULES: readonly KeywordRule[] = [
  // AI_CORE: AI 技術そのものに関する用語（高スコア）
  { word: "AX", weight: 10, category: "AI_CORE" },
  { word: "AIトランスフォーメーション", weight: 10, category: "AI_CORE" },
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
  // CONTEXT: AX人材・AI人材育成関連の用語
  { word: "AX人材", weight: 10, category: "CONTEXT" },
  { word: "AI人材", weight: 8, category: "CONTEXT" },
  { word: "数理・データサイエンス", weight: 5, category: "CONTEXT" },
  { word: "教育訓練", weight: 4, category: "CONTEXT" },
  { word: "労働市場", weight: 3, category: "CONTEXT" },
  { word: "MDASH", weight: 5, category: "CONTEXT" },
];

// ─── Tech Tag Rules ───────────────────────────────────────────────────────────
// テキストに含まれる技術ドメイン語句からテクニカルタグを抽出するための辞書。
// 比較は toLowerCase() により大文字小文字を区別しない。

interface TechTagRule {
  readonly word: string;
  readonly tag: string;
}

export const TECH_TAG_RULES: readonly TechTagRule[] = [
  { word: "認証", tag: "Authentication" },
  { word: "パスワード", tag: "Authentication" },
  { word: "データベース", tag: "Data Storage" },
  { word: "クラウド", tag: "Cloud" },
  { word: "aws", tag: "Cloud" },
  { word: "azure", tag: "Cloud" },
  { word: "rag", tag: "RAG" },
  { word: "llm", tag: "LLM" },
  { word: "api", tag: "API" },
  { word: "セキュリティ", tag: "Security" },
  { word: "著作権", tag: "IP/Copyright" },
  { word: "個人情報", tag: "Privacy" },
];

export interface ScoreResult {
  score: number;
  tags: string[];
}

// テキストを受け取り、TECH_TAG_RULES に基づくテクニカルタグの配列を返す純粋関数。
// 比較は toLowerCase() で行い、同一タグへの複数マッチは重複排除して返す。
export const extractTechTags = (text: string): string[] => {
  const lower = text.toLowerCase();
  const matched = TECH_TAG_RULES.filter((rule) => lower.includes(rule.word)).map((rule) => rule.tag);
  return Array.from(new Set(matched));
};

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

// カテゴリタグとテクニカルタグを統合して返す分析関数。
// computeScoreAndTags でカテゴリタグ（AI_CORE, GOVERNANCE, CONTEXT）を算出し、
// extractTechTags で得たテクニカルタグを結合して最終的な tags として返す。
export const analyzeText = (text: string): ScoreResult => {
  const { score, tags: categoryTags } = computeScoreAndTags(text, KEYWORD_RULES);
  const techTags = extractTechTags(text);
  return { score, tags: [...categoryTags, ...techTags] };
};

// score が 0 より大きいアイテムのみを関連情報として扱う。
export const isRelevantPolicy = (item: PolicyUpdate): boolean => item.score > 0;
