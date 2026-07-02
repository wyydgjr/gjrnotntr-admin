import { describe, it, expect, vi } from 'vitest'

// Mock axios 在模块导入前
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
    post: vi.fn(),
  },
}))

vi.mock('../../router', () => ({ default: { push: vi.fn(), replace: vi.fn() } }))
vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  adminLogin: vi.fn(),
  getUserInfo: vi.fn(),
  updateProfile: vi.fn(),
}))

import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import * as authApi from '../../api/auth'
import { setTokens, clearTokens, hasValidToken } from '../../api/request'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    clearTokens()
    vi.clearAllMocks()
  })

  it('初始时应无登录状态', () => {
    const auth = useAuthStore()
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.isAdmin).toBe(false)
    expect(auth.isRegularUser).toBe(false)
  })

  it('登录成功后应设置 Token 和用户信息', async () => {
    authApi.login.mockResolvedValue({
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      expiresIn: 7200,
      user: { id: 1, username: 'testuser', role: 'user' },
    })

    const auth = useAuthStore()
    await auth.login({ username: 'testuser', password: 'Test123' })

    expect(auth.isLoggedIn).toBe(true)
    expect(auth.isRegularUser).toBe(true)
    expect(auth.user).toEqual({ id: 1, username: 'testuser', role: 'user' })
  })

  it('登录失败应抛出错误', async () => {
    authApi.login.mockRejectedValue(new Error('用户名或密码错误'))
    const auth = useAuthStore()
    await expect(auth.login({ username: 'bad', password: 'wrong' })).rejects.toThrow()
    expect(auth.isLoggedIn).toBe(false)
  })

  it('管理员登录成功后应设置 adminUser', async () => {
    authApi.adminLogin.mockResolvedValue({
      token: 'mock-admin',
      refreshToken: 'mock-refresh-admin',
      expiresIn: 7200,
      user: { id: 2, username: 'admin', role: 'admin' },
    })

    const auth = useAuthStore()
    await auth.adminLogin({ username: 'admin', password: 'Admin123' })

    expect(auth.isAdmin).toBe(true)
    expect(auth.adminUser).toEqual({ id: 2, username: 'admin', role: 'admin' })
  })

  it('logout 应清除所有状态', async () => {
    authApi.login.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      expiresIn: 7200,
      user: { id: 1, username: 'test' },
    })

    const auth = useAuthStore()
    await auth.login({ username: 'test', password: 'Test123' })
    auth.logout()
    expect(auth.isLoggedIn).toBe(false)
    expect(auth.user).toBeNull()
    expect(auth.adminUser).toBeNull()
  })

  it('过期 Token 应返回未登录', () => {
    setTokens('old', 'old-refresh', -1)
    const auth = useAuthStore()
    auth.activeRole = 'user'
    expect(auth.isLoggedIn).toBe(false)
  })

  it('updateProfile 成功后应更新 user', async () => {
    authApi.login.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      expiresIn: 7200,
      user: { id: 1, username: 'test', nickname: '' },
    })
    authApi.updateProfile.mockResolvedValue({
      user: { id: 1, username: 'test', nickname: 'new-nick' },
    })

    const auth = useAuthStore()
    await auth.login({ username: 'test', password: 'Test123' })
    await auth.updateProfile({ nickname: 'new-nick' })
    expect(auth.user.nickname).toBe('new-nick')
  })

  it('updateProfile 失败时应回滚', async () => {
    authApi.login.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      expiresIn: 7200,
      user: { id: 1, username: 'test', nickname: 'old' },
    })
    authApi.updateProfile.mockRejectedValue(new Error('Server error'))

    const auth = useAuthStore()
    await auth.login({ username: 'test', password: 'Test123' })
    await expect(auth.updateProfile({ nickname: 'new' })).rejects.toThrow()
    expect(auth.user.nickname).toBe('old')
  })

  it('管理员 effectiveUser 应返回 adminUser', async () => {
    authApi.adminLogin.mockResolvedValue({
      token: 't',
      refreshToken: 'r',
      expiresIn: 7200,
      user: { id: 2, username: 'admin' },
    })

    const auth = useAuthStore()
    await auth.adminLogin({ username: 'admin', password: 'Admin123' })
    expect(auth.effectiveUser).toEqual({ id: 2, username: 'admin' })
  })
})
