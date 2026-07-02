/**
 * Request Dedup 测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { addPending, removePending, clearAllPending } from '../request-dedup'

describe('Request Dedup', () => {
  let config

  beforeEach(() => {
    config = {
      method: 'get',
      url: '/api/users',
      params: { page: 1 },
      data: undefined,
      signal: undefined,
    }
    clearAllPending()
  })

  it('addPending 应设置 signal', () => {
    addPending(config)
    expect(config.signal).toBeInstanceOf(AbortSignal)
  })

  it('相同请求第二次应取消第一次', () => {
    const config1 = { method: 'get', url: '/api/users', params: { page: 1 }, data: undefined }
    const config2 = { method: 'get', url: '/api/users', params: { page: 1 }, data: undefined }

    addPending(config1)
    const signal1 = config1.signal

    addPending(config2)
    expect(config1.signal.aborted).toBe(true)
    expect(config2.signal).not.toBe(signal1)
  })

  it('不同请求应共存', () => {
    const config1 = { method: 'get', url: '/api/users', params: { page: 1 }, data: undefined }
    const config2 = { method: 'get', url: '/api/users', params: { page: 2 }, data: undefined }

    addPending(config1)
    addPending(config2)

    expect(config1.signal.aborted).toBe(false)
    expect(config2.signal.aborted).toBe(false)
  })

  it('removePending 应移除请求', () => {
    addPending(config)
    removePending(config)
    // 确认移除后不会出错
    expect(() => removePending(config)).not.toThrow()
  })

  it('clearAllPending 应中止所有请求', () => {
    const config1 = { method: 'get', url: '/api/a', params: {}, data: undefined }
    const config2 = { method: 'get', url: '/api/b', params: {}, data: undefined }

    addPending(config1)
    addPending(config2)

    clearAllPending()

    expect(config1.signal.aborted).toBe(true)
    expect(config2.signal.aborted).toBe(true)
  })
})
