import type { HttpFunction } from "@google-cloud/functions-framework/build/src/functions.js";
import { OAuth2Manager } from "../auth/oauth2.js";
import { DriveService } from "../services/drive.js";
import { GmailService } from "../services/gmail.js";
import { logger } from "../utils/logger.js";

/**
 * Sample Cloud Function demonstrating OAuth2 authentication
 * and Google APIs integration
 */
export const sampleFunction: HttpFunction = async (req, res) => {
  try {
    logger.info("Sample function called", { method: req.method, url: req.url });

    // Handle OAuth2 authorization
    if (req.query.code) {
      const oauth2Manager = new OAuth2Manager();
      const tokens = await oauth2Manager.getTokens(req.query.code as string);
      oauth2Manager.setCredentials(tokens);

      // Get user info
      const userInfo = await oauth2Manager.getUserInfo();
      logger.info("User authenticated", { userId: userInfo.id, email: userInfo.email });

      // Initialize services
      const gmailService = new GmailService(oauth2Manager);
      const driveService = new DriveService(oauth2Manager);

      // Sample API calls
      const [profile, files, folders] = await Promise.all([
        gmailService.getProfile(),
        driveService.getRecentFiles(5),
        driveService.getFolders(),
      ]);

      res.json({
        success: true,
        user: userInfo,
        data: {
          gmail: {
            profile: {
              emailAddress: profile.emailAddress,
              messagesTotal: profile.messagesTotal,
              threadsTotal: profile.threadsTotal,
            },
          },
          drive: {
            recentFiles: files.files?.map((file: any) => ({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              modifiedTime: file.modifiedTime,
            })),
            folders: folders.files?.map((folder: any) => ({
              id: folder.id,
              name: folder.name,
            })),
          },
        },
      });
    } else {
      // Redirect to OAuth2 authorization
      const oauth2Manager = new OAuth2Manager();
      const authUrl = oauth2Manager.generateAuthUrl();

      res.json({
        message: "Please authorize the application",
        authUrl,
      });
    }
  } catch (error) {
    logger.error("Error in sample function", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
