import { defineStore } from 'pinia'
import {
  login as loginApi,
  adminLogin as adminLoginApi,
  getUserInfo,
  updateProfile as updateProfileApi,
} from '../api/auth'
import { setTokens, clearTokens, hasValidToken } from '../api/request'

/**
 * 认证 Store
 * - Token 存储在内存中（非 localStorage），防止 XSS 窃取
 * - 用户信息缓存在 sessionStorage（非敏感数据）
 * - 支持 Token 自动刷新
 */

const STORAGE_PREFIX = 've_'

function safeGet(key) {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + key))
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // quota exceeded, silently ignore
  }
}

function safeRemove(key) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    // ignore
  }
}

export const useAuthStore = defineStore('auth', {
  // 将 token 有效性缓存到 state 中，确保 getter 是响应式的
  state: () => ({
    user: safeGet('user'),
    adminUser: safeGet('admin_user'),
    /** @type {'user' | 'admin' | null} */
    activeRole: safeGet('active_role') || null,
    _tokenValid: hasValidToken(),
  }),

  getters: {
    isLoggedIn: (state) => state._tokenValid && state.activeRole !== null,
    isAdmin: (state) => state._tokenValid && state.activeRole === 'admin',
    isRegularUser: (state) => state._tokenValid && state.activeRole === 'user',
    effectiveUser: (state) => state.adminUser || state.user,
    currentUser: (state) => (state.activeRole === 'admin' ? state.adminUser : state.user),
  },

  actions: {
    // ── 普通用户登录 ──
    async login(credentials) {
      const res = await loginApi(credentials)
      setTokens(res.token, res.refreshToken, res.expiresIn)
      this.activeRole = 'user'
      this._tokenValid = true
      safeSet('active_role', 'user')
      this.user = res.user || null
      safeSet('user', this.user)
    },

    // ── 管理员登录 ──
    async adminLogin(credentials) {
      const res = await adminLoginApi(credentials)
      setTokens(res.token, res.refreshToken, res.expiresIn)
      this.activeRole = 'admin'
      this._tokenValid = true
      safeSet('active_role', 'admin')
      this.adminUser = res.user || null
      safeSet('admin_user', this.adminUser)
    },

    // ── 初始化认证状态（应用启动时调用） ──
    initFromStorage() {
      const role = safeGet('active_role')
      if (role && hasValidToken()) {
        this.activeRole = role
        this._tokenValid = true
        this.user = safeGet('user')
        this.adminUser = safeGet('admin_user')
      } else {
        this._clearState()
      }
    },

    // ── 获取用户信息 ──
    async fetchUser() {
      try {
        const res = await getUserInfo()
        if (this.activeRole === 'admin') {
          this.adminUser = res.user || res
          safeSet('admin_user', this.adminUser)
        } else {
          this.user = res.user || res
          safeSet('user', this.user)
        }
      } catch {
        this.logout()
      }
    },

    // ── 更新个人资料 ──
    async updateProfile(data) {
      const prevUser = this.activeRole === 'admin' ? { ...this.adminUser } : { ...this.user }
      try {
        const res = await updateProfileApi(data)
        if (this.activeRole === 'admin') {
          this.adminUser = res.user || res
          safeSet('admin_user', this.adminUser)
        } else {
          this.user = res.user || res
          safeSet('user', this.user)
        }
      } catch {
        // 回滚
        if (this.activeRole === 'admin') {
          this.adminUser = prevUser
          safeSet('admin_user', prevUser)
        } else {
          this.user = prevUser
          safeSet('user', prevUser)
        }
        throw new Error('资料更新失败')
      }
    },

    // ── 退出登录 ──
    logout() {
      clearTokens()
      this._clearState()
    },

    // ── 内部：清除状态 ──
    _clearState() {
      this.user = null
      this.adminUser = null
      this.activeRole = null
      this._tokenValid = false
      safeRemove('user')
      safeRemove('admin_user')
      safeRemove('active_role')
    },
  },
})
