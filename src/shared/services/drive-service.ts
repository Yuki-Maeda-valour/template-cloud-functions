import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Logger from '../utils/logger';

export class DriveService {
  private drive: any;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DriveService');
  }

  async initialize(): Promise<void> {
    try {
      // 環境変数から認証情報を取得
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google Drive認証情報が設定されていません');
      }

      const oauth2Client = new OAuth2Client(clientId, clientSecret);
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.logger.success('Google Driveサービスが初期化されました');
    } catch (error) {
      this.logger.error('Google Driveサービスの初期化に失敗しました', error);
      throw error;
    }
  }

  async listFiles(folderId?: string): Promise<any[]> {
    try {
      const query = folderId ? `'${folderId}' in parents` : '';
      
      const response = await this.drive.files.list({
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
        q: query
      });

      const files = response.data.files || [];
      this.logger.info(`${files.length}件のファイルが見つかりました`);
      
      return files;
    } catch (error) {
      this.logger.error('ファイル一覧の取得に失敗しました', error);
      throw error;
    }
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] })
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
      });

      const folderId = response.data.id;
      this.logger.success(`フォルダを作成しました: ${name} (ID: ${folderId})`);
      
      return folderId;
    } catch (error) {
      this.logger.error(`フォルダの作成に失敗しました: ${name}`, error);
      throw error;
    }
  }

  async uploadFile(name: string, content: Buffer, mimeType: string, parentId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: name,
        ...(parentId && { parents: [parentId] })
      };

      const media = {
        mimeType: mimeType,
        body: content
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id'
      });

      const fileId = response.data.id;
      this.logger.success(`ファイルをアップロードしました: ${name} (ID: ${fileId})`);
      
      return fileId;
    } catch (error) {
      this.logger.error(`ファイルのアップロードに失敗しました: ${name}`, error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data);
      this.logger.success(`ファイルをダウンロードしました: ${fileId}`);
      
      return buffer;
    } catch (error) {
      this.logger.error(`ファイルのダウンロードに失敗しました: ${fileId}`, error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      this.logger.success(`ファイルを削除しました: ${fileId}`);
    } catch (error) {
      this.logger.error(`ファイルの削除に失敗しました: ${fileId}`, error);
      throw error;
    }
  }
}
