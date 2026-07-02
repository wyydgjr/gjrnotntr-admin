/**
 * SEO 工具 — 动态更新页面 meta 标签 + JSON-LD 结构化数据
 *
 * 用法：
 *   import { useSeo } from '../utils/seo'
 *   const { setMeta, setProductSchema } = useSeo()
 *   setMeta({ title: '商品名 - VeStore', description: '...' })
 *   setProductSchema({ name: '...', price: '99', image: '...' })
 */

export function useSeo() {
  /** 更新页面 title + meta description + og/twitter 标签 */
  function setMeta({ title, description, image, url }) {
    document.title = title || 'VeStore - 品质生活商城'

    setMetaTag('description', description || 'VeStore 精选好物，用心为你推荐每一件值得拥有的产品，享受品质生活。')
    setMetaTag('keywords', '商城,购物,在线商城,VeStore,电商')
    setMetaTag('og:title', title)
    setMetaTag('og:description', description)
    if (image) setMetaTag('og:image', image)
    if (url) {
      setMetaTag('og:url', url)
      setLinkCanonical(url)
    }
    setMetaTag('twitter:title', title)
    setMetaTag('twitter:description', description)
    if (image) setMetaTag('twitter:image', image)
  }

  /** 注入 / 更新 JSON-LD 结构化数据 */
  function setJsonLd(scriptId, json) {
    let el = document.getElementById(scriptId)
    if (!el) {
      el = document.createElement('script')
      el.id = scriptId
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify(json, null, 2)
  }

  /** 移除 JSON-LD */
  function removeJsonLd(scriptId) {
    const el = document.getElementById(scriptId)
    if (el) el.remove()
  }

  // ── 电商专用 Schema ──

  /** Product 结构化数据 (Google 商品富摘要) */
  function setProductSchema({ name, description, image, price, currency = 'CNY', availability = 'InStock', url, sku }) {
    setJsonLd('ld-product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image,
      sku,
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: currency,
        availability: `https://schema.org/${availability}`,
        url,
      },
    })
  }

  /** BreadcrumbList 面包屑结构化数据 */
  function setBreadcrumbSchema(items) {
    setJsonLd('ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    })
  }

  /** Organization 商家信息 */
  function setOrganizationSchema({ name, url, logo, sameAs = [] } = {}) {
    setJsonLd('ld-org', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: name || 'VeStore',
      url: url || 'https://vestore.example.com',
      logo: logo || '',
      sameAs,
    })
  }

  /** Website 搜索框结构化数据 (Sitelinks Searchbox) */
  function setWebsiteSchema(url) {
    setJsonLd('ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'VeStore',
      url: url || 'https://vestore.example.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${url || 'https://vestore.example.com'}/products?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    })
  }

  /** 清理所有 SEO 相关标签（页面卸载时调用） */
  function cleanup() {
    removeJsonLd('ld-product')
    removeJsonLd('ld-breadcrumb')
  }

  return {
    setMeta,
    setProductSchema,
    setBreadcrumbSchema,
    setOrganizationSchema,
    setWebsiteSchema,
    cleanup,
  }
}

// ── 内部工具函数 ──

function setMetaTag(name, content) {
  if (!content) return
  let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}
