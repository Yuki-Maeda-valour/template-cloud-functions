import CloudAuth from '../shared/auth/cloud-auth';
import GmailService from '../shared/services/gmail-service';
import SheetsService from '../shared/services/sheets-service';
import ConfigManager from '../shared/utils/config-manager';
import Logger from '../shared/utils/logger';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const sendDailyReport: CloudFunction = {
  config: {
    name: 'send-daily-report',
    description: '日次レポートを生成してスプレッドシートに記録',
    schedule: '0 18 * * *', // 毎日18時
    timeout: 180,
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
      const gmailService = new GmailService(authClient);

      await Promise.all([sheetsService.initialize(), gmailService.initialize()]);

      // データ収集
      const unreadEmails = await gmailService.getUnreadEmails();

      // レポートデータ作成
      const today = new Date().toISOString().split('T')[0];
      const reportData = [
        ['Date', 'Unread Emails'],
        [today, unreadEmails.length],
      ];

      // 設定名からスプレッドシートIDを取得
      const configName = (data.config as string) || 'default';
      const configManager = ConfigManager.getInstance();
      const spreadsheetId = configManager.getSpreadsheetId(configName);

      if (!spreadsheetId) {
        throw new Error(`No spreadsheet ID found for config: ${configName}`);
      }

      // スプレッドシートに記録
      await sheetsService.appendData(spreadsheetId, 'A1', reportData);

      logger.info(`Daily report generated: ${unreadEmails.length} unread emails`, {
        configName,
        spreadsheetId,
      });

      return {
        success: true,
        data: {
          date: today,
          unreadEmails: unreadEmails.length,
          configName,
          spreadsheetId,
        },
        logs: [`Generated report for ${today} using config: ${configName}`],
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

export default sendDailyReport;
