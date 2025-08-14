# Template Cloud Functions

Lean Cloud Functions Architecture Template

## 概要

このテンプレートは、Google Cloud Functionsを使用したサーバーレスアーキテクチャの基盤を提供します。TypeScriptで書かれており、Gmail、Drive、Sheets APIの統合が含まれています。

## 機能

- 🚀 **Lean Architecture**: シンプルで保守しやすい構造
- 🔧 **TypeScript**: 型安全性と開発体験の向上
- 📧 **Gmail API**: メール処理と自動化
- 📁 **Drive API**: ファイル管理とバックアップ
- 📊 **Sheets API**: データ集計とレポート
- 🔐 **OAuth2**: 安全な認証システム
- 🧪 **Testing**: 包括的なテスト環境

## セットアップ

### 前提条件

- Node.js 20以上
- Google Cloud Platform アカウント
- Google Cloud CLI (`gcloud`)

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd template-cloud-functions

# 依存関係をインストール
npm install

# 環境変数を設定
cp env.example .env
# .envファイルを編集して必要な値を設定
```

### 環境変数

`.env`ファイルで以下の環境変数を設定してください：

```env
# Google Cloud 設定
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# OAuth2 設定
CLIENT_ID=your-oauth-client-id
CLIENT_SECRET=your-oauth-client-secret
REDIRECT_URI=your-redirect-uri

# API 設定
REPORT_SPREADSHEET_ID=your-spreadsheet-id
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### テスト

```bash
npm run test
```

## Biome - コード品質管理

このプロジェクトでは[Biome](https://biomejs.dev/)を使用してコードの品質管理とフォーマットを行っています。

### Biomeのインストール

```bash
npm install --save-dev --save-exact @biomejs/biome
npx @biomejs/biome init
```

### 使用方法

#### コードチェック

```bash
# リンティングのみ
npm run lint

# フォーマットチェックのみ
npm run format

# 包括的なチェック（推奨）
npm run check
```

#### 自動修正

```bash
# リンティングエラーの自動修正
npm run lint:fix

# フォーマットの自動修正
npm run format:fix

# 包括的な自動修正（推奨）
npm run check:fix
```

#### 個別コマンド

```bash
# Biomeの直接使用
npx @biomejs/biome check src/
npx @biomejs/biome check --write src/
npx @biomejs/biome format --write src/
```

### 設定

`biome.json`で以下の設定が適用されています：

- **フォーマット**: スペース2文字、行幅100文字
- **リンティング**: 推奨ルール + カスタムルール
- **インポート整理**: 自動ソート
- **型安全性**: `any`型の警告

## プロジェクト構造

```
src/
│   ├── index.ts                 # メインエントリーポイント
│   ├── functions/               # Cloud Functions
│   │   ├── backup-drive-files.ts
│   │   ├── check-unread-emails.ts
│   │   ├── clean-old-files.ts
│   │   ├── send-daily-report.ts
│   │   └── update-spreadsheet.ts
│   ├── shared/                  # 共有モジュール
│   │   ├── auth/               # 認証関連
│   │   ├── services/           # API サービス
│   │   └── utils/              # ユーティリティ
│   └── types/                  # 型定義
```

## デプロイ

### 本番環境へのデプロイ

```bash
npm run deploy
```

### ログの確認

```bash
# ログの表示
npm run logs

# リアルタイムログ
npm run logs:tail
```

## 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

ISC License

## サポート

問題が発生した場合や質問がある場合は、GitHubのIssuesを作成してください。
