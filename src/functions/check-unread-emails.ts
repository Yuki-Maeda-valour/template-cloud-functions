import CloudAuth from '../shared/auth/cloud-auth';
import GmailService from '../shared/services/gmail-service';
import Logger from '../shared/utils/logger';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const checkUnreadEmails: CloudFunction = {
  config: {
    name: 'check-unread-emails',
    description: '未読メールの数をチェック',
    schedule: '*/30 * * * *', // 30分ごと
    timeout: 60,
    memory: 256,
  },

  async handler(_data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);

    try {
      logger.info('Starting execution');

      // 認証クライアントを作成
      const auth = new CloudAuth();
      const authClient = await auth.getClient();
      const gmailService = new GmailService(authClient);
      await gmailService.initialize();

      const unreadEmails = await gmailService.getUnreadEmails();

      logger.info(`Found ${unreadEmails.length} unread emails`);

      return {
        success: true,
        data: {
          unreadCount: unreadEmails.length,
          timestamp: new Date().toISOString(),
        },
        logs: [`Checked unread emails: ${unreadEmails.length} found`],
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

export default checkUnreadEmails;
