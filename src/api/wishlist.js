/**
 * 收藏相关 API
 */
import request from './request'

/** 获取收藏列表 */
export function getWishlist() {
  return request.get('/wishlist')
}

/** 切换收藏状态 */
export function toggleWishlist(productId) {
  return request.post('/wishlist/toggle', { productId })
}
