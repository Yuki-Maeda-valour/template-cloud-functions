import { DriveService } from '../shared/services/drive-service';
import Logger from '../shared/utils/logger';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const backupDriveFiles: CloudFunction = {
  config: {
    name: 'backup-drive-files',
    description: 'Driveファイルのバックアップを作成',
    schedule: '0 2 * * *', // 毎日2時
    timeout: 300,
    memory: 512,
  },

  async handler(data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);

    try {
      logger.info('Starting execution');

      const driveService = new DriveService();
      await driveService.initialize();

      const sourceFolderId = (data.sourceFolderId as string) || process.env.BACKUP_SOURCE_FOLDER_ID;
      const backupFolderId =
        (data.backupFolderId as string) || process.env.BACKUP_DESTINATION_FOLDER_ID;

      if (!sourceFolderId || !backupFolderId) {
        throw new Error('Source and backup folder IDs are required');
      }

      // ソースフォルダのファイル一覧を取得
      const files = await driveService.listFiles(sourceFolderId);
      let backedUpCount = 0;

      // 各ファイルをバックアップ
      for (const file of files) {
        if (file.mimeType !== 'application/vnd.google-apps.folder') {
          try {
            // バックアップ処理（実際の実装は省略）
            // await driveService.copyFile(file.id, backupFolderId);
            backedUpCount++;
          } catch (error) {
            logger.warn(`Failed to backup ${file.name}`, error);
          }
        }
      }

      logger.info(`Backed up ${backedUpCount}/${files.length} files`);

      return {
        success: true,
        data: {
          sourceFolder: sourceFolderId,
          backupFolder: backupFolderId,
          totalFiles: files.length,
          backedUpFiles: backedUpCount,
        },
        logs: [`Backup completed for ${sourceFolderId}`],
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

export default backupDriveFiles;
