import type { CloudEventFunction, HttpFunction } from '@google-cloud/functions-framework';
import FunctionRegistry from './shared/utils/function-registry';
import Logger from './shared/utils/logger';
import type { FunctionContext } from './types/function';

// CloudEventのデータ構造
interface CloudEventData {
  message?: {
    data?: string;
    attributes?: { [key: string]: string };
    messageId?: string;
    publishTime?: string;
  };
}

// HTTPトリガー（シンプルルーティングのみ）
export const httpHandler: HttpFunction = async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logger = new Logger('HTTPHandler');

  try {
    await FunctionRegistry.loadFunctions();

    const { functionName, ...data } = req.body;

    if (!functionName) {
      return res.status(400).json({
        error: 'functionName is required',
        availableFunctions: FunctionRegistry.getFunctionNames(),
      });
    }

    const result = await executeFunction(functionName, data, requestId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('HTTP execution failed', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
    });
  }
};

// Pub/Subトリガー（シンプルルーティングのみ）
export const pubsubHandler: CloudEventFunction<CloudEventData> = async (cloudEvent) => {
  const requestId = `pubsub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logger = new Logger('PubSubHandler');

  try {
    await FunctionRegistry.loadFunctions();

    const message = cloudEvent.data?.message;
    const data = message?.data ? JSON.parse(Buffer.from(message.data, 'base64').toString()) : {};

    if (data.functionName) {
      await executeFunction(data.functionName, data, requestId);
    }
  } catch (error) {
    logger.error('Pub/Sub execution failed', error);
    throw error;
  }
};

// 関数実行ヘルパー（業務ロジックなし）
async function executeFunction(
  functionName: string,
  data: Record<string, unknown>,
  requestId: string
) {
  const func = FunctionRegistry.getFunction(functionName);

  if (!func) {
    throw new Error(`Function '${functionName}' not found`);
  }

  const context: FunctionContext = {
    functionName,
    requestId,
    timestamp: new Date().toISOString(),
    isLocal: process.env.NODE_ENV === 'development',
  };

  return await func.handler(data, context);
}
