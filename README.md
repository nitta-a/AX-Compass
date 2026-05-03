# AX Compass

AX Compass は、日本の政府機関が公開する AX と AI ガバナンス関連情報を定期取得し、構造化 JSON と静的フロントエンドで提供する Bun Workspaces ベースのモノレポです。

## Workspace Layout

- `packages/scraper` : 公開エンドポイントを直列に取得し、リトライと遅延を挟みながら JSON を生成するワークスペース
- `apps/frontend` : Vite + TypeScript で `/data/latest.json` を読み込み、一覧表示する静的フロントエンド
- `docs/` : `bun run build` によって生成され、GitHub Pages の配信元に指定する静的ファイル出力先

## Commands

- `bun run scraper` : scraper を実行して `apps/frontend/public/data/latest.json` を生成する
- `bun run dev` : frontend の開発サーバーを起動する
- `bun run build` : データ生成後に frontend をビルドし、ルートの `docs/` へ静的ファイルを出力する
- `bun run typecheck` : scraper と frontend の型検査をまとめて実行する

## Data Flow

1. scraper が明示的な User-Agent を付けて公開エンドポイントへアクセスする
2. 各リクエストは `for...of` による直列処理と遅延、指数バックオフ付きリトライを通る
3. 構造化済み JSON が `apps/frontend/public/data/latest.json` に書き出される
4. frontend が起動時に配信中のページ基準で `data/latest.json` を fetch し、画面へ一覧表示する
5. Vite build は相対パスで `docs/` に出力され、GitHub Pages は `main` ブランチの `/docs` フォルダをそのまま配信する

## GitHub Pages Settings

1. GitHub リポジトリの Settings を開く
2. Pages の Source で `Deploy from a branch` を選ぶ
3. Branch に `main`、Folder に `/docs` を指定する
4. `bun run build` 後の `docs/` を commit して push する