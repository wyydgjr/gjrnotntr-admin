/**
 * 订单相关 API
 */
import request from './request'

/** 获取我的订单 */
export function getMyOrders() {
  return request.get('/orders/my')
}

/** 创建订单 */
export function createOrder(data) {
  return request.post('/orders', data)
}

/** 获取订单详情 */
export function getOrderDetail(id) {
  return request.get(`/orders/${id}`)
}

/** 取消订单 */
export function cancelOrder(id) {
  return request.put(`/orders/${id}`, { status: 'cancelled' })
}
