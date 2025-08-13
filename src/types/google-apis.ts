import type { drive_v3, gmail_v1, sheets_v4 } from "googleapis";

export type GmailAPI = gmail_v1.Gmail;
export type DriveAPI = drive_v3.Drive;
export type SheetsAPI = sheets_v4.Sheets;

export interface GoogleAPICredentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

export interface GoogleAPITokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tokens: GoogleAPITokens;
}
