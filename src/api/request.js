import axios from 'axios'
import { extractError } from '../utils/error-codes'
import { addPending, removePending } from '../utils/request-dedup'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
  withCredentials: true,
})

// ── Token 管理（sessionStorage 持久化 + 内存缓存，防止 XSS 窃取） ──
const TOKEN_KEY = 've_token'
const REFRESH_KEY = 've_refresh'
const EXPIRES_KEY = 've_token_expires'

function loadTokens() {
  try {
    accessToken = sessionStorage.getItem(TOKEN_KEY) || null
    refreshToken = sessionStorage.getItem(REFRESH_KEY) || null
    tokenExpiresAt = Number(sessionStorage.getItem(EXPIRES_KEY)) || 0
    // 检查是否过期，过期则清除
    if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
      clearTokens()
    }
  } catch {
    clearTokens()
  }
}

function persistTokens() {
  try {
    if (accessToken) {
      sessionStorage.setItem(TOKEN_KEY, accessToken)
      sessionStorage.setItem(REFRESH_KEY, refreshToken || '')
      sessionStorage.setItem(EXPIRES_KEY, String(tokenExpiresAt))
    } else {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_KEY)
      sessionStorage.removeItem(EXPIRES_KEY)
    }
  } catch {
    // quota exceeded, ignore
  }
}

let accessToken = null
let refreshToken = null
let tokenExpiresAt = 0
let isRefreshing = false
let refreshQueue = []

// 模块加载时从 sessionStorage 恢复 token
loadTokens()

export function setTokens(access, refresh, expiresIn = 7200) {
  accessToken = access
  refreshToken = refresh
  tokenExpiresAt = Date.now() + expiresIn * 1000
  persistTokens()
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  tokenExpiresAt = 0
  isRefreshing = false
  refreshQueue = []
  persistTokens()
}

export function hasValidToken() {
  return !!accessToken && Date.now() < tokenExpiresAt
}

function resolveQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  refreshQueue = []
}

// ── 请求拦截器：Token 注入 + 请求去重 ──
request.interceptors.request.use((config) => {
  // Token 注入
  if (accessToken && Date.now() < tokenExpiresAt) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  // 请求去重（仅对 GET 请求做去重，POST/PUT/DELETE 不应去重）
  if (config.method === 'get' && !config._noDedup) {
    removePending(config)
    addPending(config)
  }

  return config
})

// ── 响应拦截器：统一错误处理 + Token 刷新 ──
request.interceptors.response.use(
  (res) => {
    // 移除已完成请求的去重标记
    if (res.config.method === 'get') {
      removePending(res.config)
    }
    return res.data
  },
  async (err) => {
    const { config, response } = err

    // 移除已完成的去重请求
    if (config?.method === 'get') {
      removePending(config)
    }

    // 请求被取消（去重导致）— 静默处理
    if (axios.isCancel(err)) {
      return Promise.reject({ __cancelled: true })
    }

    const status = response?.status

    // 401 — 尝试刷新 token
    if (status === 401 && refreshToken && config && !config._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          config.headers.Authorization = `Bearer ${token}`
          return request(config)
        })
      }

      config._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE || '/api'}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        )
        const { accessToken: newAccess, refreshToken: newRefresh, expiresIn } = res.data
        setTokens(newAccess, newRefresh, expiresIn)
        resolveQueue(null, newAccess)
        config.headers.Authorization = `Bearer ${newAccess}`
        return request(config)
      } catch (refreshErr) {
        resolveQueue(refreshErr)
        clearTokens()
        _redirectToLogin()
        return Promise.reject(extractError(refreshErr))
      } finally {
        isRefreshing = false
      }
    }

    // 401 且无 refresh token — 直接跳转登录
    if (status === 401 && config && !config._retry) {
      clearTokens()
      _redirectToLogin()
    }

    // 统一提取结构化错误
    const structuredError = extractError(err)
    return Promise.reject(structuredError)
  },
)

// ── 路由跳转（延迟加载 router，避免循环依赖） ──
function _redirectToLogin() {
  // 同步清除 sessionStorage 中的 auth 状态，防止路由守卫读取残留数据
  try {
    sessionStorage.removeItem('ve_user')
    sessionStorage.removeItem('ve_admin_user')
    sessionStorage.removeItem('ve_active_role')
  } catch { /* ignore */ }

  // 同时清除 Pinia store 中的状态
  try {
    import('../stores/auth').then(({ useAuthStore }) => {
      useAuthStore()._clearState()
    })
  } catch { /* ignore */ }

  try {
    import('../router/admin-router').then(({ default: router }) => {
      router.push('/admin/login')
    })
  } catch {
    window.location.href = '/admin/login'
  }
}

export default request
