import { CloudFunction, FunctionContext, FunctionResult } from '../types/function';
import { DriveService } from '../shared/services/drive-service';

const backupDriveFiles: CloudFunction = {
  config: {
    name: 'backup-drive-files',
    description: 'Backup important files to backup folder',
    schedule: '0 2 * * 0', // 毎週日曜日2時
    timeout: 300,
    memory: 512
  },

  async handler(data: any, context: FunctionContext): Promise<FunctionResult> {
    try {
      console.log(`🚀 [${context.functionName}] Starting execution`);
      
      const driveService = new DriveService();
      await driveService.initialize();
      
      const sourceFolderId = data.sourceFolderId || process.env.BACKUP_SOURCE_FOLDER;
      if (!sourceFolderId) {
        throw new Error('Source folder ID not specified');
      }
      
      // バックアップフォルダ作成
      const backupFolderName = `Backup_${new Date().toISOString().split('T')[0]}`;
      const backupFolderId = await driveService.createFolder(backupFolderName);
      
      // ファイル一覧取得
      const files = await driveService.listFiles(sourceFolderId);
      
      let backedUpCount = 0;
      for (const file of files.slice(0, 10)) { // 最初の10ファイルのみ
        if (file.id && file.name) {
          try {
            const content = await driveService.downloadFile(file.id);
            await driveService.uploadFile(
              `backup_${file.name}`,
              content,
              file.mimeType || 'application/octet-stream',
              backupFolderId
            );
            backedUpCount++;
          } catch (error) {
            console.warn(`Failed to backup ${file.name}:`, error);
          }
        }
      }
      
      console.log(`💾 Backed up ${backedUpCount}/${files.length} files`);
      
      return {
        success: true,
        data: {
          totalFiles: files.length,
          backedUpFiles: backedUpCount,
          backupFolderId
        },
        logs: [`Backed up ${backedUpCount} files`]
      };
      
    } catch (error) {
      console.error(`❌ [${context.functionName}] Error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default backupDriveFiles;
