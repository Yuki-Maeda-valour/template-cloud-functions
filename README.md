# Template Cloud Functions

Lean Cloud Functions Architecture Template

## 概要

このテンプレートは、Google Cloud Functionsを使用したサーバーレスアーキテクチャの基盤を提供します。
TypeScriptで書かれており、Gmail、Drive、Sheets APIの統合が含まれています。

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

# OAuth2 設定
CLIENT_ID=your-oauth-client-id
CLIENT_SECRET=your-oauth-client-secret
REDIRECT_URI=your-redirect-uri

# 環境設定
NODE_ENV=development
```

#### リソース設定

リソースIDは設定ファイルで管理します。`config/resources.json`を作成してください：

```json
{
  "spreadsheets": {
    "default": "your-default-spreadsheet-id",
    "sales": "sales-report-123",
    "tech": "tech-report-456",
    "hr": "hr-report-789"
  },
  "folders": {
    "default": {
      "backup_source": "your-default-backup-source-folder",
      "backup_destination": "your-default-backup-destination-folder",
      "cleanup": "your-default-cleanup-folder"
    },
    "work": {
      "backup_source": "work-source-folder",
      "backup_destination": "work-backup-folder",
      "cleanup": "work-cleanup-folder"
    },
    "personal": {
      "backup_source": "personal-source-folder",
      "backup_destination": "personal-backup-folder",
      "cleanup": "personal-cleanup-folder"
    }
  }
}
```

#### 使用方法

関数呼び出し時に設定名を指定するだけで、対応するリソースを使用できます：

```bash
# デフォルト設定を使用
curl -X POST https://your-function-url \
  -H "Content-Type: application/json" \
  -d '{"functionName": "send-daily-report"}'

# 営業設定を使用
curl -X POST https://your-function-url \
  -H "Content-Type: application/json" \
  -d '{"functionName": "send-daily-report", "config": "sales"}'

# 仕事用フォルダでバックアップ
curl -X POST https://your-function-url \
  -H "Content-Type: application/json" \
  -d '{"functionName": "backup-drive-files", "config": "work"}'
```

## 開発

### 新しい関数の作成

このプロジェクトでは、新しい関数を簡単に作成できるスクリプトが用意されています：

```bash
# 基本的な関数の作成
npm run create my-new-function

# 説明付きで関数を作成
npm run create process-data "データ処理を行う関数"
```

作成された関数は `src/functions/` ディレクトリに配置され、自動的にテンプレートが生成されます。

#### 関数の実装例

作成された関数ファイルを編集して、実際のロジックを実装します：

```typescript
// src/functions/my-new-function.ts
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import Logger from '../shared/utils/logger';

const myNewFunction: CloudFunction = {
  config: {
    name: 'my-new-function',
    description: 'データ処理を行う関数',
    timeout: 60,
    memory: 256
  },

  async handler(data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);
    
    try {
      logger.info('データ処理を開始');
      
      // 実際の処理ロジックをここに実装
      const result = await processData(data);
      
      logger.info('データ処理が完了', { result });
      
      return {
        success: true,
        data: {
          processedData: result,
          timestamp: context.timestamp,
          input: data
        },
        logs: ['データ処理が正常に完了しました']
      };
      
    } catch (error) {
      logger.error('エラーが発生しました', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
};

async function processData(data: Record<string, unknown>) {
  // データ処理のロジック
  return { processed: true, data };
}

export default myNewFunction;
```

### 開発サーバーの起動

```bash
npm run dev
```

### ローカルでのテスト

```bash
# 特定の関数をテスト
npm run test test my-new-function

# 全関数をテスト
npm run test
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
│   │   ├── helloworld.ts        # Hello World サンプル関数
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

#### 1. 環境変数の設定

```bash
# Google Cloud プロジェクトの設定
export GOOGLE_CLOUD_PROJECT=your-project-id

# リージョンの設定（オプション、デフォルト: us-central1）
export REGION=asia-northeast1

# 関数名の設定（オプション、デフォルト: template-cloud-functions）
export FUNCTION_NAME=my-custom-function
```

#### 2. デプロイの実行

```bash
npm run deploy
```

デプロイスクリプトは以下の処理を自動で行います：
- プロジェクトの設定確認
- TypeScriptのビルド
- Cloud Functionsへのデプロイ
- 関数URLの表示

#### 3. デプロイ後の確認

デプロイが完了すると、以下のような出力が表示されます：

```
✅ Deployment completed successfully!
🌐 Function URL: https://asia-northeast1-your-project-id.cloudfunctions.net/my-custom-function
```

### 関数の呼び出し

デプロイされた関数は、HTTP POSTリクエストで呼び出すことができます：

```bash
curl -X POST https://asia-northeast1-your-project-id.cloudfunctions.net/my-custom-function \
  -H "Content-Type: application/json" \
  -d '{
    "functionName": "my-new-function",
    "data": "処理したいデータ"
  }'
```

### ログの確認

```bash
# ログの表示
npm run logs

# リアルタイムログ
npm run logs:tail
```

## 開発ワークフロー例

### 1. 新しい機能の追加

```bash
# 1. 新しい関数を作成
npm run create email-processor "メール処理機能"

# 2. 関数のロジックを実装
# src/functions/email-processor.ts を編集

# 3. ローカルでテスト
npm run test test email-processor

# 4. コード品質チェック
npm run check

# 5. ビルド
npm run build

# 6. デプロイ
npm run deploy
```

### 2. 既存関数の更新

```bash
# 1. 関数のロジックを修正
# src/functions/helloworld.ts を編集

# 2. テスト実行
npm run test test helloworld

# 3. ビルドとデプロイ
npm run build && npm run deploy
```

## ライセンス

MIT License

