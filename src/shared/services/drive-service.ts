import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import Logger from '../utils/logger';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
}

export default class DriveService {
  private drive: ReturnType<typeof google.drive>;
  private logger: Logger;

  constructor(authClient: OAuth2Client) {
    this.drive = google.drive({ version: 'v3', auth: authClient });
    this.logger = new Logger('DriveService');
  }

  async initialize(): Promise<void> {
    try {
      // サービスアカウントの権限をテスト
      await this.drive.files.list({ pageSize: 1 });
      this.logger.info('Drive service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Drive service', error);
      throw error;
    }
  }

  async listFiles(folderId?: string): Promise<DriveFile[]> {
    try {
      const query = folderId ? `'${folderId}' in parents` : '';

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents)',
        pageSize: 1000,
      });

      const files = response.data.files || [];
      this.logger.info(`Found ${files.length} files in Drive`);

      // 一時的にany型を使用して型の問題を回避
      return files.map((file: any) => ({
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
        size: file.size || undefined,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        parents: file.parents || undefined,
      }));
    } catch (error) {
      this.logger.error('Failed to list files from Drive', error);
      throw error;
    }
  }

  async createFolder(name: string, parentId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] }),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      const folderId = response.data.id;
      this.logger.success(`フォルダを作成しました: ${name} (ID: ${folderId})`);

      if (!folderId) {
        throw new Error('Folder ID is required');
      }
      return folderId;
    } catch (error) {
      this.logger.error(`フォルダの作成に失敗しました: ${name}`, error);
      throw error;
    }
  }

  async uploadFile(
    name: string,
    content: Buffer,
    mimeType: string,
    parentId?: string
  ): Promise<string> {
    try {
      const fileMetadata = {
        name: name,
        ...(parentId && { parents: [parentId] }),
      };

      const media = {
        mimeType: mimeType,
        body: content,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      const fileId = response.data.id;
      this.logger.success(`ファイルをアップロードしました: ${name} (ID: ${fileId})`);

      if (!fileId) {
        throw new Error('File ID is required');
      }
      return fileId;
    } catch (error) {
      this.logger.error(`ファイルのアップロードに失敗しました: ${name}`, error);
      throw error;
    }
  }

  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const response = await this.drive.files.get(
        {
          fileId: fileId,
          alt: 'media',
        },
        {
          responseType: 'arraybuffer',
        }
      );

      const buffer = Buffer.from(response.data as any);
      this.logger.success(`ファイルをダウンロードしました: ${fileId}`);

      return buffer;
    } catch (error) {
      this.logger.error(`ファイルのダウンロードに失敗しました: ${fileId}`, error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({ fileId });
      this.logger.info(`File ${fileId} deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileId}`, error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<DriveFile | null> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,parents',
      });

      const file = response.data;

      // 一時的にany型を使用して型の問題を回避
      if (
        !file ||
        !file.id ||
        !file.name ||
        !file.mimeType ||
        !file.createdTime ||
        !file.modifiedTime
      ) {
        this.logger.warn('File missing required fields', { fileId, file });
        return null;
      }

      return {
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
        size: file.size || undefined,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        parents: file.parents || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get metadata for file ${fileId}`, error);
      return null;
    }
  }
}
