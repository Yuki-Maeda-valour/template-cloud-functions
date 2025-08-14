import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import Logger from '../utils/logger';

export class SheetsService {
  private sheets: any;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SheetsService');
  }

  async initialize(): Promise<void> {
    try {
      // 環境変数から認証情報を取得
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google Sheets認証情報が設定されていません');
      }

      const oauth2Client = new OAuth2Client(clientId, clientSecret);
      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      this.logger.success('Google Sheetsサービスが初期化されました');
    } catch (error) {
      this.logger.error('Google Sheetsサービスの初期化に失敗しました', error);
      throw error;
    }
  }

  async readData(spreadsheetId: string, range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
      });

      const values = response.data.values || [];
      this.logger.info(`スプレッドシートから${values.length}行のデータを読み取りました`);
      
      return values;
    } catch (error) {
      this.logger.error(`スプレッドシートの読み取りに失敗しました: ${spreadsheetId}`, error);
      throw error;
    }
  }

  async writeData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: values
        }
      });

      this.logger.success(`スプレッドシートに${values.length}行のデータを書き込みました`);
    } catch (error) {
      this.logger.error(`スプレッドシートの書き込みに失敗しました: ${spreadsheetId}`, error);
      throw error;
    }
  }

  async appendData(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: values
        }
      });

      this.logger.success(`スプレッドシートに${values.length}行のデータを追加しました`);
    } catch (error) {
      this.logger.error(`スプレッドシートへのデータ追加に失敗しました: ${spreadsheetId}`, error);
      throw error;
    }
  }

  async createSpreadsheet(title: string): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: title
          }
        }
      });

      const spreadsheetId = response.data.spreadsheetId;
      this.logger.success(`スプレッドシートを作成しました: ${title} (ID: ${spreadsheetId})`);
      
      return spreadsheetId;
    } catch (error) {
      this.logger.error(`スプレッドシートの作成に失敗しました: ${title}`, error);
      throw error;
    }
  }

  async getSpreadsheetInfo(spreadsheetId: string): Promise<any> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });

      const info = {
        title: response.data.properties?.title,
        sheets: response.data.sheets?.map((sheet: any) => sheet.properties?.title),
        lastModified: response.data.properties?.updated
      };

      this.logger.info(`スプレッドシート情報を取得しました: ${info.title}`);
      
      return info;
    } catch (error) {
      this.logger.error(`スプレッドシート情報の取得に失敗しました: ${spreadsheetId}`, error);
      throw error;
    }
  }
}
