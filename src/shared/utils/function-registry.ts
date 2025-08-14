import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { CloudFunction } from '../../types/function';
import Logger from './logger';

const logger = new Logger('FunctionRegistry');

// モジュールスコープで状態管理（static-only class を回避）
const functionsMap = new Map<string, CloudFunction>();
let loaded = false;

async function loadFunctions(): Promise<void> {
  if (loaded) {
    return;
  }

  const functionsDir = join(__dirname, '../../functions');
  logger.info('Loading functions from:', { functionsDir });

  try {
    const files = readdirSync(functionsDir);

    for (const filename of files) {
      if (extname(filename) === '.ts' || extname(filename) === '.js') {
        loadFunction(filename);
      }
    }

    loaded = true;
    logger.info(`Loaded ${functionsMap.size} functions`);
  } catch (error) {
    logger.warn('Could not load functions:', { error: String(error) });
  }
}

function loadFunction(filename: string): void {
  try {
    const filepath = join(__dirname, '../../functions', filename);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(filepath);

    if (isValidFunction(module.default)) {
      const func = module.default as CloudFunction;
      functionsMap.set(func.config.name, func);
      logger.info(`Loaded function: ${func.config.name}`, {
        description: func.config.description,
      });
    }
  } catch (error) {
    logger.warn(`Failed to load ${filename}:`, { error: String(error) });
  }
}

function isValidFunction(obj: unknown): boolean {
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

function getFunction(name: string): CloudFunction | undefined {
  return functionsMap.get(name);
}

function getAllFunctions(): CloudFunction[] {
  return Array.from(functionsMap.values());
}

function getFunctionNames(): string[] {
  return Array.from(functionsMap.keys());
}

function clearFunctions(): void {
  functionsMap.clear();
  loaded = false;
}

export default {
  loadFunctions,
  getFunction,
  getAllFunctions,
  getFunctionNames,
  clearFunctions,
};
