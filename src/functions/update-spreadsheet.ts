import { SheetsService } from '../shared/services/sheets-service';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const updateSpreadsheet: CloudFunction = {
  config: {
    name: 'update-spreadsheet',
    description: 'Update spreadsheet with latest data',
    schedule: '0 10 * * *', // 毎日10時
    timeout: 120,
    memory: 256,
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);

      const sheetsService = new SheetsService();
      await sheetsService.initialize();

      const spreadsheetId = data.spreadsheetId || process.env.UPDATE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID not specified');
      }

      // 現在の日時
      const now = new Date();
      const timestamp = now.toISOString();
      const dateStr = now.toISOString().split('T')[0];

      // 更新データ
      const updateData = [
        ['Last Updated', 'Timestamp', 'Status'],
        [dateStr, timestamp, 'Success'],
      ];

      // 既存データを読み取り
      let existingData: any[][] = [];
      try {
        existingData = await sheetsService.readData(spreadsheetId, 'A:C');
      } catch (error) {
        console.log('No existing data found, creating new');
      }

      // データを更新または追加
      if (existingData.length > 0) {
        // 既存データがある場合は更新
        await sheetsService.writeData(spreadsheetId, 'A1', updateData);
      } else {
        // 新規データの場合は追加
        await sheetsService.appendData(spreadsheetId, 'A1', updateData);
      }

      console.log(`📊 Spreadsheet updated successfully`);

      return {
        success: true,
        data: {
          spreadsheetId,
          lastUpdated: timestamp,
          date: dateStr,
        },
        logs: [`Updated spreadsheet at ${timestamp}`],
      };
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export default updateSpreadsheet;
