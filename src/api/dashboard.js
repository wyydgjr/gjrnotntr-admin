/**
 * 仪表盘相关 API
 */
import request from './request'

/** 获取仪表盘统计数据 */
export function getDashboardStats() {
  return request.get('/dashboard/stats')
}

/** 获取最近活动 */
export function getDashboardActivities() {
  return request.get('/dashboard/activities')
}

/** 获取营收数据 */
export function getDashboardRevenue() {
  return request.get('/dashboard/revenue')
}
