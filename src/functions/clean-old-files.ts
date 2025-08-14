import { DriveService } from '../shared/services/drive-service';
import type { CloudFunction, FunctionContext, FunctionResult } from '../types/function';

const cleanOldFiles: CloudFunction = {
  config: {
    name: 'clean-old-files',
    description: 'Clean old files based on age and size',
    schedule: '0 3 * * 0', // 毎週日曜日3時
    timeout: 240,
    memory: 256,
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);

      const driveService = new DriveService();
      await driveService.initialize();

      const targetFolderId = data.targetFolderId || process.env.CLEANUP_TARGET_FOLDER;
      if (!targetFolderId) {
        throw new Error('Target folder ID not specified');
      }

      // ファイル一覧取得
      const files = await driveService.listFiles(targetFolderId);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      let totalSizeSaved = 0;

      for (const file of files) {
        if (file.id && file.modifiedTime) {
          const modifiedDate = new Date(file.modifiedTime);

          // 30日以上古いファイルを削除
          if (modifiedDate < thirtyDaysAgo) {
            try {
              await driveService.deleteFile(file.id);
              deletedCount++;

              if (file.size) {
                totalSizeSaved += parseInt(file.size);
              }

              console.log(`🗑️ Deleted old file: ${file.name}`);
            } catch (error) {
              console.warn(`Failed to delete ${file.name}:`, error);
            }
          }
        }
      }

      const sizeInMB = Math.round((totalSizeSaved / (1024 * 1024)) * 100) / 100;
      console.log(`🧹 Cleaned up ${deletedCount} old files, saved ${sizeInMB} MB`);

      return {
        success: true,
        data: {
          deletedFiles: deletedCount,
          totalFiles: files.length,
          sizeSavedMB: sizeInMB,
        },
        logs: [`Cleaned up ${deletedCount} old files`],
      };
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export default cleanOldFiles;
