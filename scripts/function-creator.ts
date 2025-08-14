import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Logger from '../src/shared/utils/logger';

const logger = new Logger('FunctionCreator');

function createFunction(name: string, description: string = '') {
  const filename = `${name}.ts`;
  const filepath = join(__dirname, '../src/functions', filename);

  if (existsSync(filepath)) {
    logger.warn(`Function ${filename} already exists`);
    return;
  }

  const template = `import Logger from '../shared/utils/logger';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';


const ${toCamelCase(name)}: CloudFunction = {
  config: {
    name: '${name}',
    description: '${description || 'Auto-generated function'}',
    timeout: 60,
    memory: 256
  },

  async handler(data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);
    
    try {
      logger.info('Starting execution');
      
      // TODO: Implement your function logic here
      
      logger.info('Completed successfully');
      
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
      logger.error('Error occurred', error);
      
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
  logger.info(`Created function: ${filepath}`);
  logger.info(`Edit the file to implement your logic`);
  logger.info(`Test with: npm run test test ${name}`);
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
}

const args = process.argv.slice(2);
const name = args[0];
const description = args[1];

if (!name) {
  logger.error('Usage: npm run create <function-name> [description]');
  logger.error('Example: npm run create process-emails "Process unread emails"');
  process.exit(1);
}

createFunction(name, description);
