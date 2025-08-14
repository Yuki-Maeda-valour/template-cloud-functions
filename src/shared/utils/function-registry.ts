import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { CloudFunction } from '../../types/function';
import Logger from './logger';

const logger = new Logger('FunctionRegistry');

// 関数レジストリの管理
class FunctionRegistry {
  private static functions = new Map<string, CloudFunction>();
  private static loaded = false;

  static async loadFunctions(): Promise<void> {
    if (FunctionRegistry.loaded) {
      return;
    }

    const functionsDir = join(__dirname, '../../functions');
    logger.info('Loading functions from:', { functionsDir });

    try {
      const files = readdirSync(functionsDir);

      for (const filename of files) {
        if (extname(filename) === '.ts' || extname(filename) === '.js') {
          FunctionRegistry.loadFunction(filename);
        }
      }

      FunctionRegistry.loaded = true;
      logger.info(`Loaded ${FunctionRegistry.functions.size} functions`);
    } catch (error) {
      logger.warn('Could not load functions:', { error: String(error) });
    }
  }

  private static loadFunction(filename: string): void {
    try {
      const filepath = join(__dirname, '../../functions', filename);
      const module = require(filepath);

      if (FunctionRegistry.isValidFunction(module.default)) {
        const func = module.default as CloudFunction;
        FunctionRegistry.functions.set(func.config.name, func);
        logger.info(`Loaded function: ${func.config.name}`, {
          description: func.config.description,
        });
      }
    } catch (error) {
      logger.warn(`Failed to load ${filename}:`, { error: String(error) });
    }
  }

  private static isValidFunction(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    const objRecord = obj as Record<string, unknown>;

    if (!('config' in objRecord) || !('handler' in objRecord)) {
      return false;
    }

    const config = objRecord.config;
    const handler = objRecord.handler;

    if (!config || typeof config !== 'object') {
      return false;
    }

    const configRecord = config as Record<string, unknown>;

    if (!('name' in configRecord) || typeof handler !== 'function') {
      return false;
    }

    return true;
  }

  static getFunction(name: string): CloudFunction | undefined {
    return FunctionRegistry.functions.get(name);
  }

  static getAllFunctions(): CloudFunction[] {
    return Array.from(FunctionRegistry.functions.values());
  }

  static getFunctionNames(): string[] {
    return Array.from(FunctionRegistry.functions.keys());
  }

  static clearFunctions(): void {
    FunctionRegistry.functions.clear();
    FunctionRegistry.loaded = false;
  }
}

export default FunctionRegistry;
