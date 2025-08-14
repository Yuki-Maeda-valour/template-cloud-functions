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
