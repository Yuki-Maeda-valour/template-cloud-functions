import { type ChildProcess, spawn } from 'node:child_process';
import axios from 'axios';

class TestRunner {
  private server: ChildProcess | null = null;
  public readonly baseUrl = 'http://localhost:8080';

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      process.stdout.write('🚀 Starting development server...\n');

      this.server = spawn('npx', ['ts-node', 'scripts/dev-server.ts'], {
        stdio: 'pipe',
      });

      this.server.stdout?.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(output);
        if (output.includes('Development server running')) {
          setTimeout(resolve, 1000);
        }
      });

      this.server.stderr?.on('data', (data) => {
        process.stderr.write(data.toString());
      });

      this.server.on('error', reject);
    });
  }

  async listFunctions(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/functions`);
      const { functions, count } = response.data;

      process.stdout.write(`\n📋 Available Functions (${count}):\n`);
      functions.forEach((func: { name: string; description: string; schedule?: string }) => {
        process.stdout.write(`  📝 ${func.name} - ${func.description}\n`);
        if (func.schedule) {
          process.stdout.write(`      ⏰ Schedule: ${func.schedule}\n`);
        }
      });
    } catch (error) {
      process.stderr.write(
        `Failed to list functions: ${error instanceof Error ? error.message : String(error)}\n`
      );
    }
  }

  async testFunction(
    functionName: string,
    testData: Record<string, unknown> = { test: true }
  ): Promise<void> {
    try {
      process.stdout.write(`\n🧪 Testing function: ${functionName}\n`);

      const response = await axios.post(`${this.baseUrl}/test/${functionName}`, testData, {
        timeout: 30000,
      });

      process.stdout.write('✅ Test Result:\n');
      process.stdout.write(`Success: ${String(response.data.success)}\n`);
      if (response.data.data) {
        process.stdout.write(`Data: ${JSON.stringify(response.data.data, null, 2)}\n`);
      }
      if (response.data.logs) {
        process.stdout.write(`Logs: ${JSON.stringify(response.data.logs)}\n`);
      }
    } catch (error) {
      process.stdout.write('❌ Test Failed:\n');
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      if (err.response?.data?.error) {
        process.stdout.write(`Error: ${err.response.data.error}\n`);
      } else {
        process.stdout.write(`Error: ${err.message ?? 'Unknown error'}\n`);
      }
    }
  }

  async testAll(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/functions`);
      const { functions } = response.data;

      process.stdout.write(`\n🧪 Testing all ${functions.length} functions...\n\n`);

      for (const func of functions) {
        await this.testFunction(func.name);
      }
    } catch (error) {
      process.stderr.write(
        `Failed to test all functions: ${error instanceof Error ? error.message : String(error)}\n`
      );
    }
  }

  stop(): void {
    if (this.server) {
      this.server.kill();
      process.stdout.write('\n👋 Server stopped\n');
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
          process.stdout.write('Usage: npm run test test <function-name>\n');
          return;
        }
        await runner.testFunction(functionName);
        break;

      case 'test-all':
        await runner.testAll();
        break;

      case 'dev':
        await runner.listFunctions();
        process.stdout.write(`\n🌐 Dashboard: ${runner.baseUrl}\n`);
        process.stdout.write('Press Ctrl+C to stop\n');
        // 開発モードは停止しない
        return;

      default:
        process.stdout.write('Usage:\n');
        process.stdout.write('  npm run test list\n');
        process.stdout.write('  npm run test test <function-name>\n');
        process.stdout.write('  npm run test test-all\n');
        process.stdout.write('  npm run test dev\n');
    }
  } finally {
    if (command !== 'dev') {
      runner.stop();
    }
  }
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
});
