# Lean Index.ts アーキテクチャ

## 📁 **軽量ディレクトリ構造**

```
my-gcp-functions/
├── src/
│   ├── index.ts                    # 薄いルーター（肥大化しない）
│   ├── functions/                  # 個別関数ディレクトリ
│   │   ├── check-unread-emails.ts    # 独立した関数
│   │   ├── send-daily-report.ts      # 独立した関数
│   │   ├── backup-drive-files.ts     # 独立した関数
│   │   ├── clean-old-files.ts        # 独立した関数
│   │   └── update-spreadsheet.ts     # 独立した関数
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

## 🔧 **関数型定義（シンプル化）**

### **src/types/function.ts**

```typescript
export interface FunctionContext {
  functionName: string;
  requestId: string;
  timestamp: string;
  isLocal: boolean;
}

export interface FunctionResult {
  success: boolean;
  data?: any;
  error?: string;
  logs?: string[];
}

export interface FunctionConfig {
  name: string;
  description: string;
  schedule?: string;
  timeout?: number;
  memory?: number;
}

// 関数の標準インターフェース
export interface CloudFunction {
  config: FunctionConfig;
  handler: (data: any, context: FunctionContext) => Promise<FunctionResult>;
}
```

## 📋 **関数レジストリ（自動検出）**

### **src/shared/utils/function-registry.ts**

```typescript
import { readdirSync } from 'fs';
import { join, extname } from 'path';
import { CloudFunction } from '../../types/function';

class FunctionRegistry {
  private static functions = new Map<string, CloudFunction>();
  private static loaded = false;

  static async loadFunctions(): Promise<void> {
    if (this.loaded) return;

    const functionsDir = join(__dirname, '../../functions');
    console.log('🔍 Loading functions from:', functionsDir);

    try {
      const files = readdirSync(functionsDir);
      
      for (const file of files) {
        if (extname(file) === '.ts' || extname(file) === '.js') {
          await this.loadFunction(file);
        }
      }
      
      this.loaded = true;
      console.log(`✅ Loaded ${this.functions.size} functions`);
      
    } catch (error) {
      console.warn('⚠️ Could not load functions:', error);
    }
  }

  private static async loadFunction(filename: string): Promise<void> {
    try {
      const functionPath = join(__dirname, '../../functions', filename.replace(/\.(ts|js)$/, ''));
      const module = await import(functionPath);
      
      if (module.default && this.isValidFunction(module.default)) {
        const func = module.default as CloudFunction;
        this.functions.set(func.config.name, func);
        console.log(`  📝 ${func.config.name}: ${func.config.description}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load ${filename}:`, error);
    }
  }

  private static isValidFunction(obj: any): boolean {
    return obj?.config?.name && typeof obj?.handler === 'function';
  }

  static getFunction(name: string): CloudFunction | undefined {
    return this.functions.get(name);
  }

  static getAllFunctions(): CloudFunction[] {
    return Array.from(this.functions.values());
  }

  static getFunctionNames(): string[] {
    return Array.from(this.functions.keys());
  }
}

export default FunctionRegistry;
```

## 🎯 **薄いindex.ts（業務ロジックなし）**

### **src/index.ts**

```typescript
import { HttpFunction, CloudEventFunction } from '@google-cloud/functions-framework';
import { PubsubMessage } from '@google-cloud/pubsub';
import { CloudEvent } from '@google-cloud/functions-framework';
import FunctionRegistry from './shared/utils/function-registry';
import { FunctionContext } from './types/function';

// HTTPトリガー（シンプルルーティングのみ）
export const httpHandler: HttpFunction = async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await FunctionRegistry.loadFunctions();
    
    const { functionName, ...data } = req.body;
    
    if (!functionName) {
      return res.status(400).json({
        error: 'functionName is required',
        availableFunctions: FunctionRegistry.getFunctionNames()
      });
    }

    const result = await executeFunction(functionName, data, requestId);
    res.status(200).json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

// Pub/Subトリガー（シンプルルーティングのみ）
export const pubsubHandler: CloudEventFunction<PubsubMessage> = async (cloudEvent) => {
  const requestId = `pubsub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    await FunctionRegistry.loadFunctions();
    
    const message = cloudEvent.data?.message;
    const data = message?.data ? 
      JSON.parse(Buffer.from(message.data, 'base64').toString()) : {};
    
    if (data.functionName) {
      await executeFunction(data.functionName, data, requestId);
    }
    
  } catch (error) {
    console.error('Pub/Sub execution failed:', error);
    throw error;
  }
};

// 関数実行ヘルパー（業務ロジックなし）
async function executeFunction(functionName: string, data: any, requestId: string) {
  const func = FunctionRegistry.getFunction(functionName);
  
  if (!func) {
    throw new Error(`Function '${functionName}' not found`);
  }

  const context: FunctionContext = {
    functionName,
    requestId,
    timestamp: new Date().toISOString(),
    isLocal: process.env.NODE_ENV === 'development'
  };

  return await func.handler(data, context);
}
```

## 📝 **独立関数ファイル例**

### **src/functions/check-unread-emails.ts**

```typescript
import { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import { GmailService } from '../shared/services/gmail-service';

const checkUnreadEmails: CloudFunction = {
  config: {
    name: 'check-unread-emails',
    description: 'Check and count unread emails',
    schedule: '0 9 * * *', // 毎日9時
    timeout: 60,
    memory: 256
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);
      
      const gmailService = new GmailService();
      await gmailService.initialize();
      
      const unreadEmails = await gmailService.getUnreadEmails();
      
      console.log(`📧 Found ${unreadEmails.length} unread emails`);
      
      return {
        success: true,
        data: {
          unreadCount: unreadEmails.length,
          timestamp: context.timestamp
        },
        logs: [`Found ${unreadEmails.length} unread emails`]
      };
      
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default checkUnreadEmails;
```

### **src/functions/send-daily-report.ts**

```typescript
import { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import { SheetsService } from '../shared/services/sheets-service';
import { GmailService } from '../shared/services/gmail-service';

const sendDailyReport: CloudFunction = {
  config: {
    name: 'send-daily-report',
    description: 'Generate and send daily activity report',
    schedule: '0 18 * * *', // 毎日18時
    timeout: 180,
    memory: 256
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);
      
      const sheetsService = new SheetsService();
      const gmailService = new GmailService();
      
      await Promise.all([
        sheetsService.initialize(),
        gmailService.initialize()
      ]);
      
      // データ収集
      const unreadEmails = await gmailService.getUnreadEmails();
      
      // レポートデータ作成
      const today = new Date().toISOString().split('T')[0];
      const reportData = [
        ['Date', 'Unread Emails'],
        [today, unreadEmails.length]
      ];
      
      // スプレッドシートに記録
      const spreadsheetId = data.spreadsheetId || process.env.REPORT_SPREADSHEET_ID;
      if (spreadsheetId) {
        await sheetsService.appendData(spreadsheetId, 'A1', reportData);
      }
      
      console.log(`📊 Daily report generated: ${unreadEmails.length} unread emails`);
      
      return {
        success: true,
        data: {
          date: today,
          unreadEmails: unreadEmails.length,
          spreadsheetId
        },
        logs: [`Generated report for ${today}`]
      };
      
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default sendDailyReport;
```

### **src/functions/backup-drive-files.ts**

```typescript
import { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import { DriveService } from '../shared/services/drive-service';

const backupDriveFiles: CloudFunction = {
  config: {
    name: 'backup-drive-files',
    description: 'Backup important files to backup folder',
    schedule: '0 2 * * 0', // 毎週日曜日2時
    timeout: 300,
    memory: 512
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);
      
      const driveService = new DriveService();
      await driveService.initialize();
      
      const sourceFolderId = data.sourceFolderId || process.env.BACKUP_SOURCE_FOLDER;
      if (!sourceFolderId) {
        throw new Error('Source folder ID not specified');
      }
      
      // バックアップフォルダ作成
      const backupFolderName = `Backup_${new Date().toISOString().split('T')[0]}`;
      const backupFolderId = await driveService.createFolder(backupFolderName);
      
      // ファイル一覧取得
      const files = await driveService.listFiles(sourceFolderId);
      
      let backedUpCount = 0;
      for (const file of files.slice(0, 10)) { // 最初の10ファイルのみ
        if (file.id && file.name) {
          try {
            const content = await driveService.downloadFile(file.id);
            await driveService.uploadFile(
              `backup_${file.name}`,
              content,
              file.mimeType || 'application/octet-stream',
              backupFolderId
            );
            backedUpCount++;
          } catch (error) {
            console.warn(`Failed to backup ${file.name}:`, error);
          }
        }
      }
      
      console.log(`💾 Backed up ${backedUpCount}/${files.length} files`);
      
      return {
        success: true,
        data: {
          totalFiles: files.length,
          backedUpFiles: backedUpCount,
          backupFolderId
        },
        logs: [`Backed up ${backedUpCount} files`]
      };
      
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default backupDriveFiles;
```

## 🛠️ **開発用サーバー**

### **scripts/dev-server.ts**

```typescript
import express from 'express';
import FunctionRegistry from '../src/shared/utils/function-registry';
import { FunctionContext } from '../src/types/function';

const app = express();
const PORT = 8080;

app.use(express.json());

// 開発用ダッシュボード
app.get('/', async (req, res) => {
  await FunctionRegistry.loadFunctions();
  const functions = FunctionRegistry.getAllFunctions();
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Functions Development Dashboard</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { background: #4285f4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .function { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .function-name { font-weight: bold; color: #1a73e8; margin-bottom: 5px; }
          .function-desc { color: #666; margin-bottom: 10px; }
          .test-btn { background: #34a853; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
          .test-btn:hover { background: #137333; }
          .result { margin-top: 10px; padding: 10px; border-radius: 4px; display: none; }
          .success { background: #d4edda; color: #155724; }
          .error { background: #f8d7da; color: #721c24; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>🚀 Functions Development Dashboard</h1>
              <p>Available Functions: ${functions.length}</p>
          </div>
          
          ${functions.map(func => `
              <div class="function">
                  <div class="function-name">${func.config.name}</div>
                  <div class="function-desc">${func.config.description}</div>
                  <button class="test-btn" onclick="testFunction('${func.config.name}')">
                      Test Function
                  </button>
                  <div id="result-${func.config.name}" class="result"></div>
              </div>
          `).join('')}
      </div>

      <script>
          async function testFunction(functionName) {
              const resultDiv = document.getElementById('result-' + functionName);
              resultDiv.style.display = 'block';
              resultDiv.className = 'result';
              resultDiv.textContent = 'Testing...';

              try {
                  const response = await fetch('/test/' + functionName, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ test: true })
                  });

                  const result = await response.json();
                  
                  if (result.success) {
                      resultDiv.className = 'result success';
                      resultDiv.textContent = 'Success! ' + JSON.stringify(result.data || 'OK');
                  } else {
                      resultDiv.className = 'result error';
                      resultDiv.textContent = 'Error: ' + (result.error || 'Unknown error');
                  }
              } catch (error) {
                  resultDiv.className = 'result error';
                  resultDiv.textContent = 'Request failed: ' + error.message;
              }
          }
      </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// 関数リスト取得
app.get('/functions', async (req, res) => {
  await FunctionRegistry.loadFunctions();
  const functions = FunctionRegistry.getAllFunctions().map(f => ({
    name: f.config.name,
    description: f.config.description,
    schedule: f.config.schedule
  }));
  
  res.json({ functions, count: functions.length });
});

// 個別関数テスト
app.post('/test/:functionName', async (req, res) => {
  try {
    await FunctionRegistry.loadFunctions();
    
    const functionName = req.params.functionName;
    const func = FunctionRegistry.getFunction(functionName);
    
    if (!func) {
      return res.status(404).json({
        success: false,
        error: `Function '${functionName}' not found`
      });
    }

    const context: FunctionContext = {
      functionName,
      requestId: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isLocal: true
    };

    const result = await func.handler(req.body, context);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cloud Functions形式のエンドポイント（互換性）
app.post('/', async (req, res) => {
  try {
    await FunctionRegistry.loadFunctions();
    
    const { functionName, ...data } = req.body;
    
    if (!functionName) {
      return res.status(400).json({
        error: 'functionName is required',
        availableFunctions: FunctionRegistry.getFunctionNames()
      });
    }

    const func = FunctionRegistry.getFunction(functionName);
    if (!func) {
      return res.status(404).json({
        error: `Function '${functionName}' not found`
      });
    }

    const context: FunctionContext = {
      functionName,
      requestId: `http_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isLocal: true
    };

    const result = await func.handler(data, context);
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log(`📋 Dashboard: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/functions`);
});
```

## 🧪 **テストランナー**

### **scripts/test-runner.ts**

```typescript
import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';

class TestRunner {
  private server: ChildProcess | null = null;
  private readonly baseUrl = 'http://localhost:8080';

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting development server...');
      
      this.server = spawn('npx', ['ts-node', 'scripts/dev-server.ts'], {
        stdio: 'pipe'
      });

      this.server.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        if (output.includes('Development server running')) {
          setTimeout(resolve, 1000);
        }
      });

      this.server.stderr?.on('data', (data) => {
        console.error(data.toString());
      });

      this.server.on('error', reject);
    });
  }

  async listFunctions(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/functions`);
      const { functions, count } = response.data;
      
      console.log(`\n📋 Available Functions (${count}):`);
      functions.forEach((func: any) => {
        console.log(`  📝 ${func.name} - ${func.description}`);
        if (func.schedule) {
          console.log(`      ⏰ Schedule: ${func.schedule}`);
        }
      });
    } catch (error) {
      console.error('Failed to list functions:', error);
    }
  }

  async testFunction(functionName: string, testData: any = { test: true }): Promise<void> {
    try {
      console.log(`\n🧪 Testing function: ${functionName}`);
      
      const response = await axios.post(`${this.baseUrl}/test/${functionName}`, testData, {
        timeout: 30000
      });

      console.log('✅ Test Result:');
      console.log('Success:', response.data.success);
      if (response.data.data) {
        console.log('Data:', JSON.stringify(response.data.data, null, 2));
      }
      if (response.data.logs) {
        console.log('Logs:', response.data.logs);
      }

    } catch (error: any) {
      console.log('❌ Test Failed:');
      if (error.response?.data) {
        console.log('Error:', error.response.data.error);
      } else {
        console.log('Error:', error.message);
      }
    }
  }

  async testAll(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/functions`);
      const { functions } = response.data;
      
      console.log(`\n🧪 Testing all ${functions.length} functions...\n`);
      
      for (const func of functions) {
        await this.testFunction(func.name);
      }
    } catch (error) {
      console.error('Failed to test all functions:', error);
    }
  }

  stop(): void {
    if (this.server) {
      this.server.kill();
      console.log('\n👋 Server stopped');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const functionName = args[1];

  const runner = new TestRunner();

  // Ctrl+C ハンドリング
  process.on('SIGINT', () => {
    runner.stop();
    process.exit(0);
  });

  try {
    await runner.startServer();

    switch (command) {
      case 'list':
        await runner.listFunctions();
        break;
        
      case 'test':
        if (!functionName) {
          console.log('Usage: npm run test test <function-name>');
          return;
        }
        await runner.testFunction(functionName);
        break;
        
      case 'test-all':
        await runner.testAll();
        break;
        
      case 'dev':
        await runner.listFunctions();
        console.log(`\n🌐 Dashboard: ${runner['baseUrl']}`);
        console.log('Press Ctrl+C to stop');
        // 開発モードは停止しない
        return;
        
      default:
        console.log('Usage:');
        console.log('  npm run test list');
        console.log('  npm run test test <function-name>');
        console.log('  npm run test test-all');
        console.log('  npm run test dev');
    }
  } finally {
    if (command !== 'dev') {
      runner.stop();
    }
  }
}

main().catch(console.error);
```

## 📝 **関数作成ツール**

### **scripts/function-creator.ts**

```typescript
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

function createFunction(name: string, description: string = '') {
  const filename = `${name}.ts`;
  const filepath = join(__dirname, '../src/functions', filename);
  
  if (existsSync(filepath)) {
    console.log(`❌ Function ${filename} already exists`);
    return;
  }

  const template = `import { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const ${toCamelCase(name)}: CloudFunction = {
  config: {
    name: '${name}',
    description: '${description || 'Auto-generated function'}',
    timeout: 60,
    memory: 256
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(\`🚀 [\${context.functionName}] Starting execution\`);
      
      // TODO: Implement your function logic here
      
      console.log(\`✅ [\${context.functionName}] Completed successfully\`);
      
      return {
        success: true,
        data: {
          message: 'Function executed successfully',
          timestamp: context.timestamp,
          input: data
        },
        logs: ['Function executed successfully']
      };
      
    } catch (error) {
      console.error(\`❌ [\${context.functionName}] Error:\`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default ${toCamelCase(name)};
`;

  writeFileSync(filepath, template);
  console.log(`✅ Created function: ${filepath}`);
  console.log(`📝 Edit the file to implement your logic`);
  console.log(`🧪 Test with: npm run test test ${name}`);
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

const args = process.argv.slice(2);
const name = args[0];
const description = args[1];

if (!name) {
  console.log('Usage: npm run create <function-name> [description]');
  console.log('Example: npm run create process-emails "Process unread emails"');
  process.exit(1);
}

createFunction(name, description);
```

## 📦 **更新されたpackage.json**

```json
{
  "name": "my-gcp-functions",
  "version": "1.0.0",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "npm run test dev",
    "start": "npm run build && npx @google-cloud/functions-framework --target=httpHandler --port=8080",
    "test": "npx ts-node scripts/test-runner.ts",
    "create": "npx ts-node scripts/function-creator.ts",
    "deploy": "./scripts/deploy.sh",
    "gcp-build": "npm run build"
  },
  "dependencies": {
    "@google-cloud/functions-framework": "^3.4.2",
    "@google-cloud/pubsub": "^4.1.0",
    "googleapis": "^128.0.0",
    "google-auth-library": "^9.6.3"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2",
    "express": "^4.18.2",
    "axios": "^1.6.0"
  },
  "engines": {
    "node": "20"
  }
}
```

## 🎯 **使用方法**

### **新しい関数を作成**
```bash
# 関数作成
npm run create my-new-function "My function description"

# 作成されたファイルを編集
# src/functions/my-new-function.ts
```

### **開発とテスト**
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

### **関数実行**
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

## ✅ **この構成の利点**

1. **index.tsが肥大化しない**: 薄いルーターのみ
2. **関数の独立性**: 各関数が完全に独立したファイル
3. **簡単な追加**: 1コマンドで新関数作成
4. **個別テスト**: 関数ごとに独立してテスト可能
5. **自動検出**: 新しい関数ファイルを自動認識
6. **ブラウザダッシュボード**: 視覚的な開発環境

これで、index.tsを変更することなく関数をどんどん追加できます！
