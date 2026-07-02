/**
 * 企业级请求重试工具
 * 支持指数退避 + 抖动
 */
export async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null,
    shouldRetry = () => true,
  } = options

  let lastError

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err

      if (attempt === retries || !shouldRetry(err)) {
        throw err
      }

      // 指数退避 + 随机抖动
      const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 500, maxDelay)

      if (onRetry) {
        onRetry({ attempt: attempt + 1, delay, error: err })
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * 网络状态检测
 */
export function useNetworkStatus() {
  const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine

  function onOnline(cb) {
    if (typeof window === 'undefined') return () => {}
    window.addEventListener('online', cb)
    return () => window.removeEventListener('online', cb)
  }

  function onOffline(cb) {
    if (typeof window === 'undefined') return () => {}
    window.addEventListener('offline', cb)
    return () => window.removeEventListener('offline', cb)
  }

  return { isOnline, onOnline, onOffline }
}
