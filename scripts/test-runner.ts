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
