import { GmailService } from '../shared/services/gmail-service';
import { SheetsService } from '../shared/services/sheets-service';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const sendDailyReport: CloudFunction = {
  config: {
    name: 'send-daily-report',
    description: 'Generate and send daily activity report',
    schedule: '0 18 * * *', // 毎日18時
    timeout: 180,
    memory: 256,
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);

      const sheetsService = new SheetsService();
      const gmailService = new GmailService();

      await Promise.all([sheetsService.initialize(), gmailService.initialize()]);

      // データ収集
      const unreadEmails = await gmailService.getUnreadEmails();

      // レポートデータ作成
      const today = new Date().toISOString().split('T')[0];
      const reportData = [
        ['Date', 'Unread Emails'],
        [today, unreadEmails.length],
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
          spreadsheetId,
        },
        logs: [`Generated report for ${today}`],
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

export default sendDailyReport;
