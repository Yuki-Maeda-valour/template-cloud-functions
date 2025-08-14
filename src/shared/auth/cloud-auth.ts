import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import Logger from '../utils/logger';

export default class CloudAuth {
  private auth: OAuth2Client;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('CloudAuth');

    this.auth = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    if (process.env.REFRESH_TOKEN) {
      this.auth.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
        scope: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/spreadsheets',
        ],
      });
    }
  }

  async getClient(): Promise<OAuth2Client> {
    try {
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('アクセストークンが取得できませんでした');
      }

      this.logger.info('OAuth2 client initialized successfully');
      return client;
    } catch (error) {
      this.logger.error('Failed to get OAuth2 client', error);
      throw error;
    }
  }

  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
  }

  async getTokensFromCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const { tokens } = await this.auth.getToken(code);

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('トークンの取得に失敗しました');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
    } catch (error) {
      this.logger.error('Failed to get tokens from code', error);
      throw error;
    }
  }
}
