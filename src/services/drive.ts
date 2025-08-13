import { google } from "googleapis";
import type { OAuth2Manager } from "../auth/oauth2.js";
import type { DriveAPI } from "../types/google-apis.js";

export class DriveService {
  private drive: DriveAPI;

  constructor(oauth2Manager: OAuth2Manager) {
    this.drive = google.drive({
      version: "v3",
      auth: oauth2Manager.getAuthenticatedClient(),
    });
  }

  /**
   * List files in Google Drive
   */
  async listFiles(pageSize = 10, query?: string) {
    const response = await this.drive.files.list({
      pageSize,
      ...(query && { q: query }),
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
    });
    return response.data;
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string) {
    const response = await this.drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, modifiedTime, createdTime, owners, permissions",
    });
    return response.data;
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string) {
    const response = await this.drive.files.get({
      fileId,
      alt: "media",
    });
    return response.data;
  }

  /**
   * Search files by name
   */
  async searchByName(fileName: string) {
    return this.listFiles(50, `name contains '${fileName}'`);
  }

  /**
   * Get files by MIME type
   */
  async getFilesByType(mimeType: string) {
    return this.listFiles(50, `mimeType='${mimeType}'`);
  }

  /**
   * Get recent files
   */
  async getRecentFiles(pageSize = 10) {
    return this.listFiles(pageSize, "modifiedTime > '2024-01-01T00:00:00'");
  }

  /**
   * Get folders only
   */
  async getFolders() {
    return this.listFiles(50, "mimeType='application/vnd.google-apps.folder'");
  }

  /**
   * Get files in a specific folder
   */
  async getFilesInFolder(folderId: string) {
    return this.listFiles(50, `'${folderId}' in parents`);
  }
}
