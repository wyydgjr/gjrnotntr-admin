/**
 * 统一错误码枚举
 * 所有 API 错误都通过此枚举统一管理
 */

export const ErrorCode = {
  // 认证相关 1xxx
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // 资源相关 2xxx
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // 校验相关 3xxx
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  OUT_OF_STOCK: 'OUT_OF_STOCK',

  // 服务器相关 5xxx
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',

  // 网络相关 9xxx
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
}

/**
 * HTTP 状态码 → 错误码映射
 */
export const HTTP_ERROR_MAP = {
  400: ErrorCode.INVALID_INPUT,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.INSUFFICIENT_PERMISSIONS,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  429: ErrorCode.RATE_LIMITED,
  500: ErrorCode.INTERNAL_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE,
}

/**
 * 用户友好的错误消息
 */
export const ErrorMessages = {
  [ErrorCode.UNAUTHORIZED]: '请先登录',
  [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCode.ACCOUNT_DISABLED]: '该账号已被禁用',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: '权限不足',
  [ErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ErrorCode.ALREADY_EXISTS]: '资源已存在',
  [ErrorCode.CONFLICT]: '数据冲突，请刷新后重试',
  [ErrorCode.VALIDATION_ERROR]: '输入数据格式有误',
  [ErrorCode.INVALID_INPUT]: '输入数据格式有误',
  [ErrorCode.OUT_OF_STOCK]: '库存不足',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂不可用，请稍后重试',
  [ErrorCode.RATE_LIMITED]: '请求过于频繁，请稍后重试',
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络',
  [ErrorCode.TIMEOUT]: '请求超时，请稍后重试',
}

/**
 * 从 HTTP 响应中提取错误信息
 * @param {Error} error - axios 错误对象
 * @returns {{ code: string, message: string }}
 */
export function extractError(error) {
  if (error.response) {
    const status = error.response.status
    const serverMessage = error.response.data?.message
    const code = HTTP_ERROR_MAP[status] || ErrorCode.INTERNAL_ERROR
    return {
      code,
      message: serverMessage || ErrorMessages[code] || '未知错误',
    }
  }

  if (error.code === 'ECONNABORTED') {
    return { code: ErrorCode.TIMEOUT, message: ErrorMessages[ErrorCode.TIMEOUT] }
  }

  if (!error.response && error.request) {
    return { code: ErrorCode.NETWORK_ERROR, message: ErrorMessages[ErrorCode.NETWORK_ERROR] }
  }

  return { code: ErrorCode.INTERNAL_ERROR, message: error.message || '未知错误' }
}
