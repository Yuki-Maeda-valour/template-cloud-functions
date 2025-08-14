# 🚀 Lean Cloud Functions Architecture Template

Google Cloud Functions用の軽量で拡張可能なアーキテクチャテンプレートです。

## ✨ 特徴

- **薄いindex.ts**: 業務ロジックなしのシンプルなルーター
- **関数の独立性**: 各関数が完全に独立したファイル
- **自動検出**: 新しい関数ファイルを自動認識
- **簡単な追加**: 1コマンドで新関数作成
- **個別テスト**: 関数ごとに独立してテスト可能
- **ブラウザダッシュボード**: 視覚的な開発環境

## 📁 ディレクトリ構造

```
template-cloud-functions/
├── src/
│   ├── index.ts                    # 薄いルーター（肥大化しない）
│   ├── functions/                  # 個別関数ディレクトリ
│   │   ├── check-unread-emails.ts    # 未読メールチェック
│   │   ├── send-daily-report.ts      # 日次レポート送信
│   │   ├── backup-drive-files.ts     # Driveファイルバックアップ
│   │   ├── clean-old-files.ts        # 古いファイルクリーンアップ
│   │   └── update-spreadsheet.ts     # スプレッドシート更新
│   ├── shared/                     # 共通モジュール
│   │   ├── services/
│   │   │   ├── gmail-service.ts
│   │   │   ├── drive-service.ts
│   │   │   └── sheets-service.ts
│   │   ├── auth/
│   │   │   ├── oauth-manager.ts
│   │   │   └── cloud-auth.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── function-registry.ts
│   └── types/
│       └── function.ts
├── scripts/
│   ├── dev-server.ts              # 開発用サーバー
│   ├── test-runner.ts             # 関数テストランナー
│   └── function-creator.ts        # 新関数作成ツール
└── package.json
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp env.example .env
# .envファイルを編集して認証情報を設定
```

必要な環境変数:
- `GOOGLE_CLIENT_ID`: Google OAuth クライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuth クライアントシークレット
- `GOOGLE_REFRESH_TOKEN`: Google OAuth リフレッシュトークン
- `GOOGLE_CLOUD_PROJECT`: Google Cloud プロジェクトID

### 3. ビルド

```bash
npm run build
```

## 🧪 使用方法

### 新しい関数を作成

```bash
# 関数作成
npm run create my-new-function "My function description"

# 作成されたファイルを編集
# src/functions/my-new-function.ts
```

### 開発とテスト

```bash
# 開発サーバー起動（ダッシュボード付き）
npm run dev

# 関数一覧表示
npm run test list

# 特定の関数をテスト
npm run test test check-unread-emails

# 全関数をテスト
npm run test test-all
```

### 関数実行

```bash
# HTTPリクエスト形式
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"functionName": "check-unread-emails", "test": true}'

# 個別テスト形式
curl -X POST http://localhost:8080/test/check-unread-emails \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 🌐 開発ダッシュボード

開発サーバー起動後、ブラウザで `http://localhost:8080` にアクセスすると、以下の機能が利用できます：

- 利用可能な関数の一覧表示
- 各関数の個別テスト実行
- テスト結果の表示
- 関数の説明とスケジュール情報

## 📦 デプロイ

### Google Cloud Functions へのデプロイ

```bash
# ビルド
npm run build

# デプロイ（gcloud CLIが必要）
gcloud functions deploy httpHandler \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated
```

### Cloud Run へのデプロイ

```bash
# ビルド
npm run build

# デプロイ
gcloud run deploy my-function \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 利用可能なスクリプト

- `npm run build`: TypeScriptコードをビルド
- `npm run dev`: 開発サーバーを起動
- `npm run start`: 本番用サーバーを起動
- `npm run test`: テストランナーを実行
- `npm run create`: 新しい関数を作成
- `npm run gcp-build`: Google Cloud Functions用ビルド

## 📝 関数の追加方法

1. **関数作成ツールを使用**:
   ```bash
   npm run create my-function "Function description"
   ```

2. **手動で作成**:
   - `src/functions/` ディレクトリに新しいファイルを作成
   - `CloudFunction` インターフェースを実装
   - `config` と `handler` プロパティを定義

3. **自動認識**:
   - 新しい関数ファイルは自動的にレジストリに登録される
   - index.tsの変更は不要

## 🎯 アーキテクチャの利点

1. **index.tsが肥大化しない**: 薄いルーターのみ
2. **関数の独立性**: 各関数が完全に独立したファイル
3. **簡単な追加**: 1コマンドで新関数作成
4. **個別テスト**: 関数ごとに独立してテスト可能
5. **自動検出**: 新しい関数ファイルを自動認識
6. **ブラウザダッシュボード**: 視覚的な開発環境
