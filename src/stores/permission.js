/**
 * RBAC 权限 Store
 * - 角色列表 + 权限矩阵
 * - 细粒度操作权限（查看/新增/编辑/删除）
 * - 菜单权限过滤
 */
import { defineStore } from 'pinia'
import request from '../api/request'

const PERMISSION_MATRIX = {
  // 默认角色权限
  super_admin: {
    dashboard: ['view'],
    users: ['view', 'create', 'edit', 'delete'],
    products: ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'edit', 'delete', 'export'],
    coupons: ['view', 'create', 'edit', 'delete'],
    banners: ['view', 'create', 'edit', 'delete'],
    reviews: ['view', 'delete'],
    afterSales: ['view', 'edit'],
    invoices: ['view', 'edit'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    purchaseOrders: ['view', 'create', 'edit', 'delete'],
    specTemplates: ['view', 'create', 'edit', 'delete'],
    auditLogs: ['view'],
    settings: ['view', 'edit'],
    reports: ['view', 'export'],
    inventory: ['view', 'edit'],
    roles: ['view', 'create', 'edit', 'delete'],
  },
  admin: {
    dashboard: ['view'],
    users: ['view', 'create', 'edit'],
    products: ['view', 'create', 'edit', 'delete'],
    categories: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'edit', 'delete', 'export'],
    coupons: ['view', 'create', 'edit', 'delete'],
    banners: ['view', 'create', 'edit', 'delete'],
    reviews: ['view', 'delete'],
    afterSales: ['view', 'edit'],
    invoices: ['view', 'edit'],
    suppliers: ['view', 'create', 'edit'],
    purchaseOrders: ['view', 'create', 'edit'],
    specTemplates: ['view', 'create', 'edit'],
    auditLogs: ['view'],
    settings: ['view'],
    reports: ['view', 'export'],
    inventory: ['view', 'edit'],
    roles: [],
  },
  operator: {
    dashboard: ['view'],
    users: ['view'],
    products: ['view', 'edit'],
    categories: ['view'],
    orders: ['view', 'edit'],
    coupons: ['view'],
    banners: ['view'],
    reviews: ['view'],
    afterSales: ['view', 'edit'],
    invoices: ['view', 'edit'],
    suppliers: ['view'],
    purchaseOrders: ['view'],
    specTemplates: ['view'],
    auditLogs: ['view'],
    settings: [],
    reports: ['view'],
    inventory: ['view'],
    roles: [],
  },
  viewer: {
    dashboard: ['view'],
    users: ['view'],
    products: ['view'],
    categories: ['view'],
    orders: ['view'],
    coupons: ['view'],
    banners: ['view'],
    reviews: ['view'],
    afterSales: ['view'],
    invoices: ['view'],
    suppliers: ['view'],
    purchaseOrders: ['view'],
    specTemplates: ['view'],
    auditLogs: ['view'],
    settings: [],
    reports: ['view'],
    inventory: ['view'],
    roles: [],
  },
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    roles: [],
    currentRole: 'admin',
    loading: false,
  }),

  getters: {
    /** 当前角色的完整权限矩阵 */
    permissions: (state) => PERMISSION_MATRIX[state.currentRole] || PERMISSION_MATRIX.viewer,

    /** 检查是否有某资源的某操作权限 */
    can: (state) => (resource, action = 'view') => {
      const perms = PERMISSION_MATRIX[state.currentRole]
      if (!perms) return false
      return (perms[resource] || []).includes(action)
    },

    /** 获取所有可用角色 */
    roleOptions: () => [
      { value: 'super_admin', label: '超级管理员' },
      { value: 'admin', label: '管理员' },
      { value: 'operator', label: '运营人员' },
      { value: 'viewer', label: '只读用户' },
    ],

    /** 根据角色过滤可见菜单 */
    visibleMenuKeys: (state) => {
      const perms = PERMISSION_MATRIX[state.currentRole]
      if (!perms) return []
      return Object.entries(perms)
        .filter(([, actions]) => actions.includes('view'))
        .map(([key]) => key)
    },
  },

  actions: {
    async fetchRoles() {
      this.loading = true
      try {
        const data = await request.get('/roles')
        this.roles = data.list || data
      } catch {
        this.roles = []
      } finally {
        this.loading = false
      }
    },

    async saveRole(role) {
      if (role.id) {
        return request.put(`/roles/${role.id}`, role)
      }
      return request.post('/roles', role)
    },

    async deleteRole(id) {
      return request.delete(`/roles/${id}`)
    },

    setRole(roleName) {
      if (PERMISSION_MATRIX[roleName]) {
        this.currentRole = roleName
      }
    },
  },
})
