/**
 * 统一日志工具
 * 开发环境输出到 console，生产环境可对接 Sentry 等监控平台
 */

const isDev = import.meta.env.DEV

const logger = {
  /** 信息日志 */
  info(...args) {
    if (isDev) console.info('[VeStore]', ...args)
  },

  /** 警告日志 */
  warn(...args) {
    if (isDev) console.warn('[VeStore]', ...args)
  },

  /**
   * 错误日志
   * 生产环境应上报到 Sentry / DataDog 等监控平台
   */
  error(message, error) {
    if (isDev) {
      console.error('[VeStore]', message, error)
      return
    }
    // TODO: 接入生产环境错误上报
    // Sentry.captureException(error, { extra: { message } })
  },
}

export default logger
