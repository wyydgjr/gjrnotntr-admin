/**
 * 认证相关 API
 */
import request from './request'

/** 普通用户登录 */
export function login(data) {
  return request.post('/auth/login', data)
}

/** 管理员登录 */
export function adminLogin(data) {
  return request.post('/auth/admin-login', data)
}

/** 用户注册 */
export function register(data) {
  return request.post('/auth/register', data)
}

/** 获取当前用户信息 */
export function getUserInfo() {
  return request.get('/auth/userinfo')
}

/** 更新个人资料 */
export function updateProfile(data) {
  return request.put('/auth/profile', data)
}

/** 修改密码 */
export function changePassword(data) {
  return request.put('/auth/password', data)
}
