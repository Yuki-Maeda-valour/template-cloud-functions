import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import Logger from '../utils/logger';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
      attachmentId?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: { data?: string; attachmentId?: string };
    }>;
  };
}

export default class GmailService {
  private gmail: ReturnType<typeof google.gmail>;
  private logger: Logger;

  constructor(authClient: OAuth2Client) {
    this.gmail = google.gmail({ version: 'v1', auth: authClient });
    this.logger = new Logger('GmailService');
  }

  async initialize(): Promise<void> {
    try {
      // サービスアカウントの権限をテスト
      await this.gmail.users.getProfile({ userId: 'me' });
      this.logger.info('Gmail service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gmail service', error);
      throw error;
    }
  }

  async getUnreadEmails(): Promise<GmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 100,
      });

      const messages = response.data.messages || [];
      this.logger.info(`Found ${messages.length} unread emails`);

      return messages.map((message) => ({
        id: message.id!,
        threadId: message.threadId!,
        labelIds: message.labelIds || [],
        snippet: message.snippet || '',
        historyId: message.historyId!,
        internalDate: message.internalDate!,
      }));
    } catch (error) {
      this.logger.error('Failed to get unread emails', error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });

      this.logger.info(`Email ${messageId} marked as read`);
    } catch (error) {
      this.logger.error(`Failed to mark email ${messageId} as read`, error);
      throw error;
    }
  }

  async getEmailDetails(messageId: string): Promise<GmailMessageDetail | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      return {
        id: message.id!,
        threadId: message.threadId!,
        labelIds: message.labelIds || [],
        snippet: message.snippet || '',
        historyId: message.historyId!,
        internalDate: message.internalDate!,
        payload: message.payload!,
      };
    } catch (error) {
      this.logger.error(`Failed to get email details for ${messageId}`, error);
      return null;
    }
  }
}
