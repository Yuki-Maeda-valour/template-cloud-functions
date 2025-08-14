import { GoogleAuth } from 'google-auth-library';
import Logger from '../utils/logger';

export class CloudAuth {
  private auth: GoogleAuth;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('CloudAuth');
    this.auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
  }

  async getClient(): Promise<any> {
    try {
      const client = await this.auth.getClient();
      this.logger.success('Cloud認証クライアントを取得しました');
      return client;
    } catch (error) {
      this.logger.error('Cloud認証クライアントの取得に失敗しました', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    try {
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('アクセストークンが取得できませんでした');
      }

      this.logger.success('Cloudアクセストークンを取得しました');
      return accessToken.token;
    } catch (error) {
      this.logger.error('Cloudアクセストークンの取得に失敗しました', error);
      throw error;
    }
  }

  async getProjectId(): Promise<string> {
    try {
      const projectId = await this.auth.getProjectId();
      this.logger.info(`プロジェクトID: ${projectId}`);
      return projectId;
    } catch (error) {
      this.logger.error('プロジェクトIDの取得に失敗しました', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.auth.getClient();
      return true;
    } catch (error) {
      this.logger.warn('認証されていません', error);
      return false;
    }
  }
}
