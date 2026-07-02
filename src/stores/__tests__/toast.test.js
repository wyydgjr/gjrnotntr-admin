/**
 * Toast Store 测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '../toast'

describe('Toast Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初始时应无消息', () => {
    const toast = useToastStore()
    expect(toast.messages).toHaveLength(0)
  })

  it('show 应添加消息', () => {
    const toast = useToastStore()
    toast.show('测试消息')
    expect(toast.messages).toHaveLength(1)
    expect(toast.messages[0].message).toBe('测试消息')
  })

  it('show 默认类型应为 info', () => {
    const toast = useToastStore()
    toast.show('消息')
    expect(toast.messages[0].type).toBe('info')
  })

  it('show 可指定类型', () => {
    const toast = useToastStore()
    toast.show('成功', 'success')
    expect(toast.messages[0].type).toBe('success')
  })

  it('3 秒后应自动移除消息', () => {
    const toast = useToastStore()
    toast.show('临时消息')
    expect(toast.messages).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(toast.messages).toHaveLength(0)
  })

  it('remove 应移除指定消息', () => {
    const toast = useToastStore()
    toast.show('消息1')
    toast.show('消息2')
    expect(toast.messages).toHaveLength(2)

    const id = toast.messages[0].id
    toast.remove(id)
    expect(toast.messages).toHaveLength(1)
    expect(toast.messages[0].message).toBe('消息2')
  })

  it('多条消息应独立计时', () => {
    const toast = useToastStore()
    toast.show('消息1')
    vi.advanceTimersByTime(1000)
    toast.show('消息2')
    expect(toast.messages).toHaveLength(2)

    vi.advanceTimersByTime(2000) // 消息1 到期
    expect(toast.messages).toHaveLength(1)
    expect(toast.messages[0].message).toBe('消息2')
  })
})
