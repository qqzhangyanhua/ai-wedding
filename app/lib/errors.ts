/**
 * 应用错误类型定义 - 增强版
 *
 * 改进：
 * 1. 添加 details 字段携带额外上下文
 * 2. 添加 toJSON 方法便于 API 返回
 * 3. 修复原型链
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly userMessage?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';

    // 修复原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.userMessage || this.message,
        details: this.details,
      },
    };
  }
}

export class AuthError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'AUTH_ERROR', 401, userMessage || '认证失败，请重新登录');
    this.name = 'AuthError';
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number) {
    const message = `积分不足: 需要 ${required}，当前 ${available}`;
    super(
      message,
      'INSUFFICIENT_CREDITS',
      402, // 使用 402 Payment Required
      `积分不足，还需要 ${required - available} 积分`,
      { required, available, shortfall: required - available }
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class GenerationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'GENERATION_FAILED',
      500,
      userMessage || 'AI生成失败，请重试'
    );
    this.name = 'GenerationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 0, '网络连接失败，请检查您的网络');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      userMessage || '输入数据不合法，请检查后重试'
    );
    this.name = 'ValidationError';
  }
}

/**
 * 错误消息映射
 */
export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_ERROR: '认证失败，请重新登录',
  INSUFFICIENT_CREDITS: '积分不足，请购买积分',
  GENERATION_FAILED: 'AI生成失败，请重试',
  NETWORK_ERROR: '网络错误，请检查连接',
  VALIDATION_ERROR: '输入数据不合法',
  NOT_FOUND: '请求的资源不存在',
  TIMEOUT: '请求超时，请重试',
  RATE_LIMIT: '请求过于频繁，请稍后再试',
  SERVER_ERROR: '服务器错误，请稍后重试',
};

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyError(error: Error | AppError): string {
  if (error instanceof AppError && error.userMessage) {
    return error.userMessage;
  }

  if (error instanceof AppError && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  // 根据错误消息关键词匹配
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (message.includes('unauthorized') || message.includes('auth')) {
    return ERROR_MESSAGES.AUTH_ERROR;
  }

  if (message.includes('not found') || message.includes('404')) {
    return ERROR_MESSAGES.NOT_FOUND;
  }

  if (message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  if (message.includes('rate limit') || message.includes('too many')) {
    return ERROR_MESSAGES.RATE_LIMIT;
  }

  // 默认错误消息
  return '抱歉，系统遇到了一个意外错误，请稍后重试';
}

/**
 * 判断是否为 AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 从任意错误提取信息（用于 API 返回）
 */
export function extractErrorInfo(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
} {
  if (isAppError(error)) {
    return {
      message: error.userMessage || error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: getUserFriendlyError(error),
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };
  }

  return {
    message: '未知错误',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

/**
 * 错误日志记录（可集成 Sentry 等服务）
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  const logData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // 开发环境：详细日志
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', logData);
  } else {
    // 生产环境：简化日志
    console.error(`[${error.name}] ${error.message}`);
  }

  // TODO: 集成错误监控服务
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

