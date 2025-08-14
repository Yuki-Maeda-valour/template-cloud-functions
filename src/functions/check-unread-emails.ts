import { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import { GmailService } from '../shared/services/gmail-service';

const checkUnreadEmails: CloudFunction = {
  config: {
    name: 'check-unread-emails',
    description: 'Check and count unread emails',
    schedule: '0 9 * * *', // 毎日9時
    timeout: 60,
    memory: 256
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);
      
      const gmailService = new GmailService();
      await gmailService.initialize();
      
      const unreadEmails = await gmailService.getUnreadEmails();
      
      console.log(`📧 Found ${unreadEmails.length} unread emails`);
      
      return {
        success: true,
        data: {
          unreadCount: unreadEmails.length,
          timestamp: context.timestamp
        },
        logs: [`Found ${unreadEmails.length} unread emails`]
      };
      
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default checkUnreadEmails;
