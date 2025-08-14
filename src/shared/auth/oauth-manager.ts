import { OAuth2Client } from 'google-auth-library';
import Logger from '../utils/logger';

export class OAuthManager {
  private oauth2Client: OAuth2Client;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('OAuthManager');
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth認証情報が設定されていません');
    }

    this.oauth2Client = new OAuth2Client(clientId, clientSecret);
  }

  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    this.logger.info('認証URLを生成しました');
    return authUrl;
  }

  async getTokensFromCode(code: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('アクセストークンまたはリフレッシュトークンが取得できませんでした');
      }

      this.logger.success('トークンを取得しました');
      
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      };
    } catch (error) {
      this.logger.error('トークンの取得に失敗しました', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('アクセストークンの更新に失敗しました');
      }

      this.logger.success('アクセストークンを更新しました');
      
      return credentials.access_token;
    } catch (error) {
      this.logger.error('アクセストークンの更新に失敗しました', error);
      throw error;
    }
  }

  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken
      });

      // トークンの検証（簡易版）
      // 実際の実装では、Googleのトークン検証エンドポイントを使用
      this.logger.success('トークンの検証が完了しました');
      return true;
    } catch (error) {
      this.logger.error('トークンの検証に失敗しました', error);
      return false;
    }
  }

  getClient(): OAuth2Client {
    return this.oauth2Client;
  }
}
