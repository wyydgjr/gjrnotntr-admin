/**
 * 企业级监控工具
 * 集成 Web Vitals + 错误上报
 */

const isProd = import.meta.env.PROD

// ── 错误上报 ──
export function reportError(error, context = {}) {
  const payload = {
    message: error.message || String(error),
    stack: error.stack || '',
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  if (isProd) {
    // 发送到错误收集服务
    // TODO: 替换为实际 Sentry DSN
    // Sentry.captureException(error, { extra: context })
    sendBeacon('/api/audit-logs', payload)
  } else {
    console.error('[Monitor]', payload)
  }
}

// ── Web Vitals 上报 ──
export function reportWebVital(name, value, rating) {
  const payload = {
    name,
    value: Math.round(value),
    rating,
    timestamp: Date.now(),
  }

  if (isProd) {
    sendBeacon('/api/audit-logs', { type: 'web_vital', ...payload })
  }

  // 仅在开发环境打印
  if (!isProd) {
    const color = rating === 'good' ? 'green' : rating === 'needs-improvement' ? 'orange' : 'red'
    console.log(`%c[Web Vital] ${name}: ${Math.round(value)} (${rating})`, `color: ${color}`)
  }
}

// ── 页面性能追踪 ──
export function trackPageLoad() {
  if (typeof window === 'undefined' || !window.performance) return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const timing = {
          dns: entry.domainLookupEnd - entry.domainLookupStart,
          tcp: entry.connectEnd - entry.connectStart,
          ttfb: entry.responseStart - entry.requestStart,
          domParse: entry.domContentLoadedEventEnd - entry.responseEnd,
          loadComplete: entry.loadEventEnd - entry.fetchStart,
        }
        if (!isProd) {
          console.log('[Performance]', timing)
        }
      }
    }
  })
  observer.observe({ type: 'navigation', buffered: true })
}

// ── 辅助：sendBeacon ──
function sendBeacon(url, data) {
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    navigator.sendBeacon(url, blob)
  }
}

// ── 全局 Promise rejection 处理 ──
export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, { type: 'global_error', filename: event.filename })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { type: 'unhandled_promise_rejection' })
  })
}
