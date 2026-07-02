/**
 * 企业级 SEO / 元数据管理
 * 使用方式：
 *   useMeta({ title: '商品列表', description: '浏览全部商品' })
 */
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const BASE_TITLE = 'VeStore'

export function useMeta(meta = {}) {
  const route = useRoute()

  function applyMeta(m) {
    // 动态 title
    const title = m.title
      ? `${m.title} | ${BASE_TITLE}`
      : route.meta?.title
        ? `${route.meta.title} | ${BASE_TITLE}`
        : BASE_TITLE
    document.title = title

    // Description
    if (m.description) {
      setMetaTag('description', m.description)
    }

    // Keywords
    if (m.keywords) {
      setMetaTag('keywords', m.keywords)
    }

    // Open Graph
    if (m.title) {
      setMetaProp('og:title', title)
    }
    if (m.description) {
      setMetaProp('og:description', m.description)
    }
    if (m.image) {
      setMetaProp('og:image', m.image)
    }
    setMetaProp('og:url', window.location.href)
  }

  onMounted(() => {
    applyMeta(meta)
  })

  watch(
    () => route.path,
    () => {
      // 路由切换时重置为基础标题
      if (!meta.title) {
        const routeTitle = route.meta?.title
        document.title = routeTitle ? `${routeTitle} | ${BASE_TITLE}` : BASE_TITLE
      }
    },
  )

  return { updateMeta: applyMeta }
}

function setMetaTag(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaProp(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
