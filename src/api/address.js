/**
 * 地址相关 API
 */
import request from './request'

/** 获取收货地址列表 */
export function getAddresses() {
  return request.get('/addresses')
}

/** 新增或更新地址 */
export function saveAddress(data) {
  if (data.id) return request.put(`/addresses/${data.id}`, data)
  return request.post('/addresses', data)
}

/** 删除地址 */
export function deleteAddress(id) {
  return request.delete(`/addresses/${id}`)
}
