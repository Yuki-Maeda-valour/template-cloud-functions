# TypeScript Cloud Functions Template

TypeScript で構築された Google Cloud Functions のテンプレートプロジェクトです。Gmail、Google Drive、Google Sheets API との連携に対応しています。

## 🚀 機能

- **TypeScript** - 型安全な開発環境
- **esbuild** - 高速ビルド
- **Biome** - 統合されたリンター・フォーマッター
- **Vitest** - 高速テストランナー
- **Functions Framework** - ローカル開発サーバー
- **Google APIs** - Gmail、Drive、Sheets API 対応
- **OAuth2 認証** - Google アカウント認証
- **GitHub Actions** - CI/CD パイプライン
- **Dependabot** - 依存関係自動更新

## 📋 前提条件

- **Node.js 18.x** 以上
- **npm** または **yarn**
- **Google Cloud CLI** ([インストール手順](https://cloud.google.com/sdk/docs/install))
- **Google Cloud プロジェクト**

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd template-cloud-functions
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` ファイルを編集して必要な値を設定：

```env
# Google Cloud設定
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# OAuth2設定
OAUTH2_CLIENT_ID=your-client-id.apps.googleusercontent.com
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_REDIRECT_URI=http://localhost:8080/oauth2callback

# Functions Framework設定
FUNCTION_TARGET=main
PORT=8080

# 環境
NODE_ENV=development

# デプロイ設定
GOOGLE_CLOUD_REGION=asia-northeast1
```

### 4. Google Cloud の設定

#### 4.1 認証

```bash
# Google Cloud にログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID
```

#### 4.2 必要なAPIの有効化

```bash
# Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Gmail API
gcloud services enable gmail.googleapis.com

# Google Drive API
gcloud services enable drive.googleapis.com

# Google Sheets API
gcloud services enable sheets.googleapis.com
```

#### 4.3 OAuth2 クライアントの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. **APIs & Services** > **Credentials** に移動
3. **+ CREATE CREDENTIALS** > **OAuth client ID** を選択
4. **Application type**: Web application
5. **Authorized redirect URIs** に以下を追加：
   - `http://localhost:8080/oauth2callback`
   - デプロイ後のCloud Functions URL + `/oauth2callback`
6. 作成後、Client ID と Client Secret を `.env` に設定

## 💻 開発

### 利用可能なコマンド

```bash
# 開発サーバー起動（自動リロード）
npm run dev

# ビルド
npm run build

# ビルド（ウォッチモード）
npm run build:watch

# 型チェック
npm run typecheck

# リント・フォーマット
npm run check
npm run check:fix

# テスト実行
npm test
npm run test:watch
npm run test:ui
npm run test:coverage

# プロジェクトクリーン
npm run clean
```

### ローカル開発の流れ

1. **開発サーバー起動**
   ```bash
   npm run dev
   ```

2. **ブラウザでアクセス**
   ```
   http://localhost:8080
   ```

3. **OAuth2 認証フロー**
   - 初回アクセス時に認証URLが表示されます
   - 認証後、Google APIs のサンプルデータが表示されます

### プロジェクト構造

```
src/
├── functions/          # Cloud Functions エントリーポイント
│   └── sample.ts       # サンプル関数
├── services/           # Google APIs サービス層
│   ├── gmail.ts        # Gmail API
│   ├── drive.ts        # Google Drive API
│   └── sheets.ts       # Google Sheets API
├── auth/               # 認証関連
│   └── oauth2.ts       # OAuth2 管理クラス
├── utils/              # ユーティリティ
│   ├── config.ts       # 環境変数管理
│   └── logger.ts       # ログ出力
└── types/              # TypeScript 型定義
    ├── environment.ts  # 環境変数の型
    └── google-apis.ts  # Google APIs の型
```

## 🚀 デプロイ

### 手動デプロイ

```bash
# プロダクションデプロイ
npm run deploy

# デプロイ後のログ確認
npm run logs

# リアルタイムログ監視
npm run logs:tail
```

### デプロイスクリプト使用

```bash
# 開発環境
./deploy.sh dev

# 本番環境
./deploy.sh prod your-project-id
```

### GitHub Actions による手動デプロイ

GitHub の Actions タブから手動でデプロイワークフローを実行できます。

#### 使用方法

1. GitHub リポジトリの **Actions** タブに移動
2. **Manual Deploy** ワークフローを選択
3. **Run workflow** をクリック
4. 環境を選択（development/production）
5. ワークフローが完了したら、ローカルで手動デプロイ

#### 必要な GitHub Secrets

| Secret名 | 説明 |
|----------|------|
| `SNYK_TOKEN` | Snyk API トークン（オプション） |

#### デプロイフロー

```bash
# 1. GitHub Actions でビルド・テスト確認
# 2. ローカルで認証
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. 手動デプロイ
npm run deploy
```

## 🧪 テスト

### テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# UI付きテスト
npm run test:ui

# カバレッジ付きテスト
npm run test:coverage
```

### テストファイルの配置

```
src/
├── auth/
│   ├── oauth2.ts
│   └── __tests__/
│       └── oauth2.test.ts
└── utils/
    ├── config.ts
    └── __tests__/
        └── config.test.ts
```

## 🔧 設定ファイル

| ファイル | 用途 |
|----------|------|
| `tsconfig.json` | TypeScript 設定 |
| `biome.json` | Biome（リント・フォーマット）設定 |
| `vitest.config.ts` | Vitest（テスト）設定 |
| `nodemon.json` | 開発時の自動リロード設定 |
| `.gcloudignore` | Cloud Functions デプロイ時の除外設定 |
| `cloudbuild.yaml` | Cloud Build 設定 |

## 📱 API 使用例

### Gmail API

```typescript
import { GmailService } from './services/gmail.js';

const gmailService = new GmailService(oauth2Manager);

// プロフィール取得
const profile = await gmailService.getProfile();

// メッセージ一覧取得
const messages = await gmailService.listMessages('is:unread', 10);

// 特定メッセージ取得
const message = await gmailService.getMessage(messageId);
```

### Google Drive API

```typescript
import { DriveService } from './services/drive.js';

const driveService = new DriveService(oauth2Manager);

// ファイル一覧取得
const files = await driveService.listFiles(10);

// ファイル検索
const searchResults = await driveService.searchByName('report');

// フォルダ一覧
const folders = await driveService.getFolders();
```

### Google Sheets API

```typescript
import { SheetsService } from './services/sheets.js';

const sheetsService = new SheetsService(oauth2Manager);

// スプレッドシート情報取得
const metadata = await sheetsService.getSpreadsheetMetadata(spreadsheetId);

// セル値取得
const values = await sheetsService.getValues(spreadsheetId, 'Sheet1!A1:B10');

// セル値更新
await sheetsService.updateValues(spreadsheetId, 'Sheet1!A1:B2', [
  ['Name', 'Age'],
  ['John', '25']
]);
```

## 🔒 セキュリティ

- **環境変数**: 秘密情報は `.env` で管理（gitignore済み）
- **OAuth2**: Google の標準認証フロー
- **GitHub Actions**: Secrets で認証情報を安全に管理
- **依存関係**: Dependabot による自動更新
- **脆弱性チェック**: Snyk と npm audit による定期スキャン

## 🚨 トラブルシューティング

### よくある問題

#### 1. 認証エラー

```bash
Error: The Application Default Credentials are not available.
```

**解決方法**:
```bash
gcloud auth application-default login
```

#### 2. API が有効化されていない

```bash
Error: Gmail API has not been used in project
```

**解決方法**:
```bash
gcloud services enable gmail.googleapis.com
```

#### 3. OAuth2 認証が失敗する

- リダイレクトURIが正しく設定されているか確認
- `.env` の `OAUTH2_CLIENT_ID` と `OAUTH2_CLIENT_SECRET` が正しいか確認

#### 4. デプロイが失敗する

```bash
# Cloud Functions API が有効か確認
gcloud services list --enabled | grep cloudfunctions

# 権限が正しく設定されているか確認
gcloud iam service-accounts list
```

### デバッグ

```bash
# 詳細ログでデプロイ
gcloud functions deploy main --verbosity=debug

# 関数のログ確認
npm run logs:tail
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- **コミットメッセージ**: [Conventional Commits](https://www.conventionalcommits.org/) に従う
- **コードスタイル**: Biome の設定に従う
- **テスト**: 新機能には必ずテストを追加
- **型安全**: TypeScript の strict モードを維持

## 📄 ライセンス

このプロジェクトは ISC ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Google Cloud Functions](https://cloud.google.com/functions)
- [Google APIs](https://developers.google.com/apis-explorer)
- [TypeScript](https://www.typescriptlang.org/)
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**