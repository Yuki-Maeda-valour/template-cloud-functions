import CloudAuth from '../shared/auth/cloud-auth';
import SheetsService from '../shared/services/sheets-service';
import Logger from '../shared/utils/logger';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const updateSpreadsheet: CloudFunction = {
  config: {
    name: 'update-spreadsheet',
    description: 'スプレッドシートのデータを更新',
    timeout: 120,
    memory: 256,
  },

  async handler(data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);

    try {
      logger.info('Starting execution');

      // 認証クライアントを作成
      const auth = new CloudAuth();
      const authClient = await auth.getClient();
      const sheetsService = new SheetsService(authClient);
      await sheetsService.initialize();

      const spreadsheetId = data.spreadsheetId as string;
      const newData = data.data as string[][];

      if (!spreadsheetId || !newData) {
        throw new Error('spreadsheetId and data are required');
      }

      // 既存データを読み取り
      let existingData: string[][] = [];
      try {
        const data = await sheetsService.readData(spreadsheetId, 'A:C');
        existingData = data as string[][];
      } catch {
        logger.info('No existing data found, creating new');
      }

      // 新しいデータを追加
      await sheetsService.appendData(spreadsheetId, 'A1', newData);

      logger.info(`Updated spreadsheet with ${newData.length} rows`);

      return {
        success: true,
        data: {
          spreadsheetId,
          rowsAdded: newData.length,
          totalRows: existingData.length + newData.length,
        },
        logs: [`Updated spreadsheet ${spreadsheetId}`],
      };
    } catch (error) {
      logger.error('Error occurred', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export default updateSpreadsheet;
