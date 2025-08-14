import { readdirSync } from 'fs';
import { extname, join } from 'path';
import type { CloudFunction } from '../../types/function';

class FunctionRegistry {
  private static functions = new Map<string, CloudFunction>();
  private static loaded = false;

  static async loadFunctions(): Promise<void> {
    if (FunctionRegistry.loaded) return;

    const functionsDir = join(__dirname, '../../functions');
    console.log('🔍 Loading functions from:', functionsDir);

    try {
      const files = readdirSync(functionsDir);

      for (const file of files) {
        if (extname(file) === '.ts' || extname(file) === '.js') {
          await FunctionRegistry.loadFunction(file);
        }
      }

      FunctionRegistry.loaded = true;
      console.log(`✅ Loaded ${FunctionRegistry.functions.size} functions`);
    } catch (error) {
      console.warn('⚠️ Could not load functions:', error);
    }
  }

  private static async loadFunction(filename: string): Promise<void> {
    try {
      const functionPath = join(__dirname, '../../functions', filename.replace(/\.(ts|js)$/, ''));
      const module = await import(functionPath);

      if (module.default && FunctionRegistry.isValidFunction(module.default)) {
        const func = module.default as CloudFunction;
        FunctionRegistry.functions.set(func.config.name, func);
        console.log(`  📝 ${func.config.name}: ${func.config.description}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load ${filename}:`, error);
    }
  }

  private static isValidFunction(obj: any): boolean {
    return obj?.config?.name && typeof obj?.handler === 'function';
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
}

export default FunctionRegistry;
