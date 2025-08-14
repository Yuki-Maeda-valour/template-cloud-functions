import { DriveService } from '../shared/services/drive-service';
import Logger from '../shared/utils/logger';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const cleanOldFiles: CloudFunction = {
  config: {
    name: 'clean-old-files',
    description: '古いファイルを削除してストレージを節約',
    schedule: '0 3 * * 0', // 毎週日曜日3時
    timeout: 300,
    memory: 512,
  },

  async handler(data: Record<string, unknown>, context: FunctionContext): Promise<FunctionResult> {
    const logger = new Logger(context.functionName);

    try {
      logger.info('Starting execution');

      const driveService = new DriveService();
      await driveService.initialize();

      const folderId = (data.folderId as string) || process.env.CLEANUP_FOLDER_ID;
      const daysOld = (data.daysOld as number) || 90;

      if (!folderId) {
        throw new Error('Folder ID is required');
      }

      const files = await driveService.listFiles(folderId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      let totalSizeSaved = 0;

      for (const file of files) {
        const fileDate = new Date(file.modifiedTime);

        if (fileDate < cutoffDate) {
          try {
            await driveService.deleteFile(file.id);
            deletedCount++;

            if (file.size) {
              totalSizeSaved += parseInt(file.size, 10);
            }

            logger.info(`Deleted old file: ${file.name}`);
          } catch (error) {
            logger.warn(`Failed to delete ${file.name}`, error);
          }
        }
      }

      const sizeInMB = Math.round((totalSizeSaved / (1024 * 1024)) * 100) / 100;
      logger.info(`Cleaned up ${deletedCount} old files, saved ${sizeInMB} MB`);

      return {
        success: true,
        data: {
          folderId,
          daysOld,
          totalFiles: files.length,
          deletedFiles: deletedCount,
          sizeSavedMB: sizeInMB,
        },
        logs: [`Cleanup completed for folder ${folderId}`],
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

export default cleanOldFiles;
