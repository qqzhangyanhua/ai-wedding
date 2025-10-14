/**
 * 结构化日志工具
 *
 * 设计原则：
 * 1. 开发环境：详细日志
 * 2. 生产环境：简化日志
 * 3. 支持条件日志
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_DEBUG = process.env.DEBUG === 'true';

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (IS_DEV || IS_DEBUG) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (IS_DEV) {
      console.info(this.formatMessage('info', message, context));
    } else {
      // 生产环境：简化日志
      console.info(`[INFO] ${message}`);
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }
}

export const logger = new Logger();

/**
 * API 请求日志器
 */
export class ApiLogger {
  constructor(private requestId: string) {}

  info(message: string, context?: LogContext): void {
    logger.info(`[${this.requestId}] ${message}`, context);
  }

  error(message: string, context?: LogContext): void {
    logger.error(`[${this.requestId}] ${message}`, context);
  }

  debug(message: string, context?: LogContext): void {
    logger.debug(`[${this.requestId}] ${message}`, context);
  }

  /**
   * 记录请求开始
   */
  logRequestStart(method: string, endpoint: string, context?: LogContext): void {
    this.info(`${method} ${endpoint} - 开始处理`, context);
  }

  /**
   * 记录请求完成
   */
  logRequestEnd(duration: number, statusCode: number): void {
    this.info(`请求完成`, { duration: `${duration}ms`, statusCode });
  }

  /**
   * 记录请求失败
   */
  logRequestError(error: Error, context?: LogContext): void {
    this.error(`请求失败: ${error.message}`, {
      ...context,
      stack: IS_DEV ? error.stack : undefined,
    });
  }
}

/**
 * 创建 API 日志器
 */
export function createApiLogger(requestId?: string): ApiLogger {
  const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return new ApiLogger(id);
}
