import { google } from "googleapis";
import type { OAuth2Manager } from "../auth/oauth2.js";
import type { GmailAPI } from "../types/google-apis.js";

export class GmailService {
  private gmail: GmailAPI;

  constructor(oauth2Manager: OAuth2Manager) {
    this.gmail = google.gmail({
      version: "v1",
      auth: oauth2Manager.getAuthenticatedClient(),
    });
  }

  /**
   * Get user's Gmail profile
   */
  async getProfile() {
    const response = await this.gmail.users.getProfile({ userId: "me" });
    return response.data;
  }

  /**
   * List messages with optional query
   */
  async listMessages(query?: string, maxResults = 10) {
    const response = await this.gmail.users.messages.list({
      userId: "me",
      ...(query && { q: query }),
      maxResults,
    });
    return response.data;
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string) {
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    return response.data;
  }

  /**
   * Get message body text
   */
  extractMessageBody(message: any): string {
    if (message.payload?.body?.data) {
      return Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    }

    if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          return Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }
    }

    return "";
  }

  /**
   * Search emails by subject
   */
  async searchBySubject(subject: string) {
    return this.listMessages(`subject:"${subject}"`);
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages() {
    return this.listMessages("is:unread");
  }
}
