/**
 * 图片懒加载指令 v-lazy
 * 用法: <img v-lazy="imageUrl" alt="..." />
 */
const observerMap = new WeakMap()

function getObserver() {
  if (typeof IntersectionObserver === 'undefined') return null
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
          }
          const observer = observerMap.get(img)
          if (observer) {
            observer.unobserve(img)
            observerMap.delete(img)
          }
        }
      })
    },
    { rootMargin: '100px' },
  )
}

let observer = null

export default {
  mounted(el, binding) {
    const src = binding.value
    if (!src) return

    if (!observer) observer = getObserver()
    if (!observer) {
      // 降级：不支持 IntersectionObserver 时直接加载
      el.src = src
      return
    }

    el.dataset.src = src
    observerMap.set(el, observer)
    observer.observe(el)
  },
  unmounted(el) {
    const obs = observerMap.get(el)
    if (obs) {
      obs.unobserve(el)
      observerMap.delete(el)
    }
  },
}
