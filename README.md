# [AX Compass]

日本の政府機関（内閣府、経済産業省、デジタル庁など）から公開されるAIトランスフォーメーション（AX）およびAIガバナンスに関するガイドラインや政策情報を自動で収集し、技術者がシステム実装やポリシー設計に活用できる形式（構造化JSON等）に変換・提供するプロジェクトです。

## Architecture & Workflow

当リポジトリは、サーバーレスな静的サイトジェネレーション（SSG）とデータ取得パイプラインを統合したモノレポ構成を採用しています。

1. **Data Ingestion (GitHub Actions)**
   - 定期実行（Cron）されるワークフローが、e-Gov API等の公式公開エンドポイントやRSSフィードを監視します。
   - レートリミットやWAFによるIPブロック（403 Forbidden）を回避するため、直列処理と適切なディレイ・リトライ機構、および明示的なUser-Agentを実装しています。
2. **Data Transformation (Bun)**
   - 取得したXML/メタデータをBunのスクリプトでパースし、フロントエンドで利用しやすいスキーマ定義済みのJSONファイルとして出力します。
3. **Static Hosting (GitHub Pages)**
   - 生成されたJSONデータをもとにフロントエンドをビルドし、GitHub Pagesへ自動デプロイします。

## Repository Structure

- `src/frontend/` : 静的サイトのUIコンポーネントおよびビルド設定
- `packages/scraper/` : e-Gov APIやRSSからのデータ取得・JSON生成を行うBunスクリプト群
- `.github/workflows/` : データ更新からデプロイまでを自動化するCI/CD定義