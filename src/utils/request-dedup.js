/**
 * 请求去重工具
 * 防止用户快速点击导致的重复请求
 */

const pendingRequests = new Map()

/**
 * 生成请求唯一标识
 * @param {object} config - axios 请求配置
 * @returns {string}
 */
function getRequestKey(config) {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

/**
 * 添加待处理请求
 * @param {object} config - axios 请求配置
 */
export function addPending(config) {
  const key = getRequestKey(config)
  // 不取消已有请求，只防止重复添加
  if (pendingRequests.has(key)) return
  const controller = new AbortController()
  config.signal = controller.signal
  pendingRequests.set(key, controller)
}

/**
 * 移除待处理请求
 * @param {object} config - axios 请求配置
 */
export function removePending(config) {
  const key = getRequestKey(config)
  if (pendingRequests.has(key)) {
    pendingRequests.delete(key)
  }
}

/**
 * 清除所有待处理请求
 */
export function clearAllPending() {
  pendingRequests.forEach((controller) => controller.abort())
  pendingRequests.clear()
}
