/**
 * API 模块统一入口
 * 使用方式：import { auth, order, address } from '@/api'
 */

export * as auth from './auth'
export * as dashboard from './dashboard'
export * as order from './order'
export * as address from './address'
export * as wishlist from './wishlist'
export * as review from './review'

// 通用 CRUD 资源 API
export { createResourceApi } from './resource'
export { default as request } from './request'
