export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any): void {
    console.log(`ℹ️ [${this.context}] ${message}`, data ? data : '');
  }

  success(message: string, data?: any): void {
    console.log(`✅ [${this.context}] ${message}`, data ? data : '');
  }

  warn(message: string, data?: any): void {
    console.warn(`⚠️ [${this.context}] ${message}`, data ? data : '');
  }

  error(message: string, error?: any): void {
    console.error(`❌ [${this.context}] ${message}`, error ? error : '');
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`🐛 [${this.context}] ${message}`, data ? data : '');
    }
  }
}

export default Logger;
