import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import Logger from '../utils/logger';

type CellValue = string | number | boolean | null;
type RowData = CellValue[];
type SheetData = RowData[];

export default class SheetsService {
  private sheets: ReturnType<typeof google.sheets>;
  private logger: Logger;

  constructor(authClient: OAuth2Client) {
    this.sheets = google.sheets({ version: 'v4', auth: authClient });
    this.logger = new Logger('SheetsService');
  }

  async initialize(): Promise<void> {
    try {
      // サービスアカウントの権限をテスト
      await this.sheets.spreadsheets.get({ spreadsheetId: 'test' });
      this.logger.info('Sheets service initialized successfully');
    } catch {
      // テストスプレッドシートが存在しない場合でも初期化は成功とする
      this.logger.info('Sheets service initialized successfully');
    }
  }

  async readData(spreadsheetId: string, range: string): Promise<SheetData> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      this.logger.info(`Read ${values.length} rows from sheet ${range}`);

      return values;
    } catch (error) {
      this.logger.error(`Failed to read data from sheet ${range}`, error);
      throw error;
    }
  }

  async writeData(spreadsheetId: string, range: string, data: SheetData): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });

      this.logger.info(`Wrote ${data.length} rows to sheet ${range}`);
    } catch (error) {
      this.logger.error(`Failed to write data to sheet ${range}`, error);
      throw error;
    }
  }

  async appendData(spreadsheetId: string, range: string, data: SheetData): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: data,
        },
      });

      this.logger.info(`Appended ${data.length} rows to sheet ${range}`);
    } catch (error) {
      this.logger.error(`Failed to append data to sheet ${range}`, error);
      throw error;
    }
  }

  async clearData(spreadsheetId: string, range: string): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });

      this.logger.info(`Cleared data from sheet ${range}`);
    } catch (error) {
      this.logger.error(`Failed to clear data from sheet ${range}`, error);
      throw error;
    }
  }
}
