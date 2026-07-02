/**
 * 评价相关 API
 */
import request from './request'

/** 提交评价 */
export function submitReview(data) {
  return request.post('/reviews', data)
}

/** 获取商品评价 */
export function getProductReviews(productId) {
  return request.get(`/reviews/product/${productId}`)
}

/** 删除评价 */
export function deleteReview(id) {
  return request.delete(`/reviews/${id}`)
}
