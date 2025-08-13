import { google } from "googleapis";
import type { OAuth2Manager } from "../auth/oauth2.js";
import type { SheetsAPI } from "../types/google-apis.js";

export class SheetsService {
  private sheets: SheetsAPI;

  constructor(oauth2Manager: OAuth2Manager) {
    this.sheets = google.sheets({
      version: "v4",
      auth: oauth2Manager.getAuthenticatedClient(),
    });
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetMetadata(spreadsheetId: string) {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: "properties,sheets(properties)",
    });
    return response.data;
  }

  /**
   * Get values from a range
   */
  async getValues(spreadsheetId: string, range: string) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    return response.data;
  }

  /**
   * Update values in a range
   */
  async updateValues(
    spreadsheetId: string,
    range: string,
    values: any[][],
    valueInputOption: "RAW" | "USER_ENTERED" = "USER_ENTERED"
  ) {
    const response = await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption,
      requestBody: {
        values,
      },
    });
    return response.data;
  }

  /**
   * Append values to a sheet
   */
  async appendValues(
    spreadsheetId: string,
    range: string,
    values: any[][],
    valueInputOption: "RAW" | "USER_ENTERED" = "USER_ENTERED"
  ) {
    const response = await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });
    return response.data;
  }

  /**
   * Clear values in a range
   */
  async clearValues(spreadsheetId: string, range: string) {
    const response = await this.sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
    return response.data;
  }

  /**
   * Get all sheet names in a spreadsheet
   */
  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    const metadata = await this.getSpreadsheetMetadata(spreadsheetId);
    return metadata.sheets?.map((sheet) => sheet.properties?.title || "") || [];
  }

  /**
   * Batch get multiple ranges
   */
  async batchGetValues(spreadsheetId: string, ranges: string[]) {
    const response = await this.sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    return response.data;
  }

  /**
   * Get first row (usually headers)
   */
  async getHeaders(spreadsheetId: string, sheetName: string) {
    const range = `${sheetName}!1:1`;
    const values = await this.getValues(spreadsheetId, range);
    return values.values?.[0] || [];
  }
}
