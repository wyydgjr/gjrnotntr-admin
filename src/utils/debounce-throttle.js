/**
 * 防抖：延迟执行，直到停止调用 N 毫秒后才执行一次
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流：每 N 毫秒最多执行一次
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔毫秒数
 * @returns {Function}
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  let timer = null
  return function (...args) {
    const now = Date.now()
    const remaining = interval - (now - lastTime)
    clearTimeout(timer)
    if (remaining <= 0) {
      lastTime = now
      fn.apply(this, args)
    } else {
      timer = setTimeout(() => {
        lastTime = Date.now()
        fn.apply(this, args)
        timer = null
      }, remaining)
    }
  }
}
