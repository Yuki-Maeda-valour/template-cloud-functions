import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import Logger from '../shared/utils/logger';

const helloworld: CloudFunction = {
  config: {
    name: 'helloworld',
    description: 'Hello World function for testing',
    timeout: 60,
    memory: 256
  },

  async handler(data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);
    
    try {
      logger.info('Starting Hello World function execution');
      
      // Hello World メッセージを生成
      const greeting = data.name ? `Hello, ${data.name}!` : 'Hello, World!';
      const timestamp = new Date().toISOString();
      
      logger.info('Hello World message generated', { greeting, timestamp });
      
      return {
        success: true,
        data: {
          message: greeting,
          timestamp: timestamp,
          requestId: context.requestId,
          functionName: context.functionName,
          input: data
        },
        logs: [`Hello World function executed successfully at ${timestamp}`]
      };
      
    } catch (error) {
      logger.error('Error occurred in Hello World function', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default helloworld;
