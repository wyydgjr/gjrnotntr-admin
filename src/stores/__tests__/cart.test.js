/**
 * Cart Store 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../api/request', () => ({
  default: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({ ok: true }),
    delete: vi.fn(),
  },
}))

import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../cart'
import request from '../../api/request'

describe('Cart Store', () => {
  const mockProduct = { id: 1, name: '测试商品', price: 99.9, image: '/test.jpg' }

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    request.put = vi.fn().mockResolvedValue({ ok: true })
    request.get = vi.fn().mockResolvedValue([])
  })

  it('应正确添加新商品', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 2)
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toMatchObject({ productId: 1, name: '测试商品', price: 99.9, qty: 2 })
  })

  it('同一商品应合并数量', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 1)
    cart.add(mockProduct, 3)
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].qty).toBe(4)
  })

  it('count 应正确计算总数量', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 3)
    cart.add({ ...mockProduct, id: 2, name: '商品2', price: 50 }, 2)
    expect(cart.count).toBe(5)
  })

  it('total 应正确计算总金额', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 2)
    expect(cart.total).toBeCloseTo(199.8)
  })

  it('isEmpty 空购物车应返回 true', () => {
    const cart = useCartStore()
    expect(cart.isEmpty).toBe(true)
    cart.add(mockProduct, 1)
    expect(cart.isEmpty).toBe(false)
  })

  it('应正确更新商品数量', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 1)
    cart.updateQty(1, 5)
    expect(cart.items[0].qty).toBe(5)
  })

  it('数量 <= 0 应移除商品', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 1)
    cart.updateQty(1, 0)
    expect(cart.items).toHaveLength(0)
  })

  it('应正确删除指定商品', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 1)
    cart.add({ ...mockProduct, id: 2, name: '商品2' }, 1)
    cart.remove(1)
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].productId).toBe(2)
  })

  it('clear 应移除所有商品', () => {
    const cart = useCartStore()
    cart.add(mockProduct, 1)
    cart.add({ ...mockProduct, id: 2, name: '商品2' }, 1)
    cart.clear()
    expect(cart.items).toHaveLength(0)
    expect(cart.isEmpty).toBe(true)
  })

  it('应从 localStorage 恢复数据', () => {
    localStorage.setItem(
      've_cart_items',
      JSON.stringify([{ productId: 1, name: '已保存商品', price: 10, image: '', qty: 1 }]),
    )
    const cart = useCartStore()
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].name).toBe('已保存商品')
  })

  it('无效 JSON 应降级为空数组', () => {
    localStorage.setItem('ve_cart_items', 'not-json')
    const cart = useCartStore()
    expect(cart.items).toEqual([])
  })
})
