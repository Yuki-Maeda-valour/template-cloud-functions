import { readdirSync } from 'fs';
import { join, extname } from 'path';
import { CloudFunction } from '../../types/function';

class FunctionRegistry {
  private static functions = new Map<string, CloudFunction>();
  private static loaded = false;

  static async loadFunctions(): Promise<void> {
    if (this.loaded) return;

    const functionsDir = join(__dirname, '../../functions');
    console.log('🔍 Loading functions from:', functionsDir);

    try {
      const files = readdirSync(functionsDir);
      
      for (const file of files) {
        if (extname(file) === '.ts' || extname(file) === '.js') {
          await this.loadFunction(file);
        }
      }
      
      this.loaded = true;
      console.log(`✅ Loaded ${this.functions.size} functions`);
      
    } catch (error) {
      console.warn('⚠️ Could not load functions:', error);
    }
  }

  private static async loadFunction(filename: string): Promise<void> {
    try {
      const functionPath = join(__dirname, '../../functions', filename.replace(/\.(ts|js)$/, ''));
      const module = await import(functionPath);
      
      if (module.default && this.isValidFunction(module.default)) {
        const func = module.default as CloudFunction;
        this.functions.set(func.config.name, func);
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
    return this.functions.get(name);
  }

  static getAllFunctions(): CloudFunction[] {
    return Array.from(this.functions.values());
  }

  static getFunctionNames(): string[] {
    return Array.from(this.functions.keys());
  }
}

export default FunctionRegistry;
