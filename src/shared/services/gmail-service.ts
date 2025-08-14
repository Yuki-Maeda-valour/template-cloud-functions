import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Logger from '../utils/logger';

export class GmailService {
  private gmail: any;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('GmailService');
  }

  async initialize(): Promise<void> {
    try {
      // 環境変数から認証情報を取得
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Gmail認証情報が設定されていません');
      }

      const oauth2Client = new OAuth2Client(clientId, clientSecret);
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      this.logger.success('Gmailサービスが初期化されました');
    } catch (error) {
      this.logger.error('Gmailサービスの初期化に失敗しました', error);
      throw error;
    }
  }

  async getUnreadEmails(): Promise<any[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread'
      });

      const messages = response.data.messages || [];
      this.logger.info(`${messages.length}件の未読メールが見つかりました`);
      
      return messages;
    } catch (error) {
      this.logger.error('未読メールの取得に失敗しました', error);
      throw error;
    }
  }

  async getEmailDetails(messageId: string): Promise<any> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });

      return response.data;
    } catch (error) {
      this.logger.error(`メール詳細の取得に失敗しました: ${messageId}`, error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      this.logger.success(`メールを既読にしました: ${messageId}`);
    } catch (error) {
      this.logger.error(`メールの既読化に失敗しました: ${messageId}`, error);
      throw error;
    }
  }
}
