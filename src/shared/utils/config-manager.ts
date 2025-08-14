import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Logger from './logger';

interface ResourceConfig {
  spreadsheets: {
    [key: string]: string;
  };
  folders: {
    [key: string]: {
      backup_source: string;
      backup_destination: string;
      cleanup: string;
    };
  };
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: ResourceConfig | null = null;
  private logger = new Logger('ConfigManager');

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 設定ファイルを読み込み
   */
  loadConfig(): ResourceConfig {
    try {
      const configPath = join(process.cwd(), 'config', 'resources.json');
      const configData = readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(configData) as ResourceConfig;
      this.config = parsedConfig;
      this.logger.info('Configuration loaded successfully');
      return parsedConfig;
    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      throw new Error(
        'Configuration file not found or invalid. Please create config/resources.json'
      );
    }
  }

  /**
   * 設定を取得
   */
  getConfig(): ResourceConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * スプレッドシートIDを取得
   */
  getSpreadsheetId(configName: string = 'default'): string {
    const config = this.getConfig();
    const spreadsheetId = config.spreadsheets[configName];

    if (!spreadsheetId) {
      this.logger.warn(`Spreadsheet config '${configName}' not found, using default`);
      return config.spreadsheets.default || '';
    }

    return spreadsheetId;
  }

  /**
   * フォルダ設定を取得
   */
  getFolderConfig(configName: string = 'default'): {
    backup_source: string;
    backup_destination: string;
    cleanup: string;
  } {
    const config = this.getConfig();
    const folderConfig = config.folders[configName];

    if (!folderConfig) {
      this.logger.warn(`Folder config '${configName}' not found, using default`);
      return (
        config.folders.default || {
          backup_source: '',
          backup_destination: '',
          cleanup: '',
        }
      );
    }

    return folderConfig;
  }

  /**
   * 利用可能な設定名一覧を取得
   */
  getAvailableConfigs(): {
    spreadsheets: string[];
    folders: string[];
  } {
    const config = this.getConfig();
    return {
      spreadsheets: Object.keys(config.spreadsheets),
      folders: Object.keys(config.folders),
    };
  }

  /**
   * 設定が有効かチェック
   */
  validateConfig(): boolean {
    try {
      const config = this.getConfig();

      // 必須設定の存在チェック
      if (!config.spreadsheets.default) {
        this.logger.error('Default spreadsheet ID is required');
        return false;
      }

      if (!config.folders.default) {
        this.logger.error('Default folder configuration is required');
        return false;
      }

      this.logger.info('Configuration validation passed');
      return true;
    } catch (error) {
      this.logger.error('Configuration validation failed', error);
      return false;
    }
  }
}

export default ConfigManager;
