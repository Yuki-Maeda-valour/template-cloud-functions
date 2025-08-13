import { google } from "googleapis";
import type { AuthenticatedUser, GoogleAPITokens } from "../types/google-apis.js";

// Define scopes locally to avoid importing config at module-evaluation time
const OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
] as const;

export class OAuth2Manager {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;

  constructor() {
    const clientId = process.env.OAUTH2_CLIENT_ID ?? "";
    const clientSecret = process.env.OAUTH2_CLIENT_SECRET ?? "";
    const redirectUri = process.env.OAUTH2_REDIRECT_URI ?? "";

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generate an OAuth2 authorization URL
   */
  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: OAUTH_SCOPES as unknown as string[],
      prompt: "consent",
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string): Promise<GoogleAPITokens> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens as GoogleAPITokens;
  }

  /**
   * Set credentials for the OAuth2 client
   */
  setCredentials(tokens: GoogleAPITokens): void {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<GoogleAPITokens> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials as GoogleAPITokens;
  }

  /**
   * Get the authenticated OAuth2 client
   */
  getAuthenticatedClient() {
    return this.oauth2Client;
  }

  /**
   * Get user info from Google API
   */
  async getUserInfo(): Promise<AuthenticatedUser> {
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    if (!data.id || !data.email || !data.name) {
      throw new Error("Failed to get user info from Google API");
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      tokens: this.oauth2Client.credentials as GoogleAPITokens,
    };
  }
}
