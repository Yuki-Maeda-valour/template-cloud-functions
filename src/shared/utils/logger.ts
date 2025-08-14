export default class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('INFO', message, data);
  }

  success(message: string, data?: Record<string, unknown>): void {
    this.log('SUCCESS', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('WARN', message, data);
  }

  error(message: string, error?: unknown): void {
    this.log('ERROR', message, { error: error instanceof Error ? error.message : String(error) });
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }

  private log(level: string, message: string, data?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data }),
    };

    // 本番環境では適切なログサービスに送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: Cloud Loggingや他のログサービスに送信
      return;
    }

    // 開発環境では構造化ログを出力
    process.stdout.write(`${JSON.stringify(logEntry)}\n`);
  }
}
