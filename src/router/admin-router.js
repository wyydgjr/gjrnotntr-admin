import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSeo } from '../utils/seo'

const routes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue'),
    meta: { guest: true, title: '管理员登录 - VeStore' },
  },
  {
    path: '/admin',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '仪表盘', requiresAdmin: true } },
      { path: 'users', name: 'UserList', component: () => import('../views/UserList.vue'), meta: { title: '用户管理', requiresAdmin: true } },
      { path: 'users/new', name: 'UserCreate', component: () => import('../views/UserForm.vue'), meta: { title: '新增用户', requiresAdmin: true } },
      { path: 'users/:id/edit', name: 'UserEdit', component: () => import('../views/UserForm.vue'), meta: { title: '编辑用户', requiresAdmin: true } },
      { path: 'products', name: 'ProductList', component: () => import('../views/ProductList.vue'), meta: { title: '产品管理', requiresAdmin: true } },
      { path: 'products/new', name: 'ProductCreate', component: () => import('../views/ProductForm.vue'), meta: { title: '新增产品', requiresAdmin: true } },
      { path: 'products/:id/edit', name: 'ProductEdit', component: () => import('../views/ProductForm.vue'), meta: { title: '编辑产品', requiresAdmin: true } },
      { path: 'categories', name: 'CategoryList', component: () => import('../views/CategoryList.vue'), meta: { title: '分类管理', requiresAdmin: true } },
      { path: 'categories/new', name: 'CategoryCreate', component: () => import('../views/CategoryForm.vue'), meta: { title: '新增分类', requiresAdmin: true } },
      { path: 'categories/:id/edit', name: 'CategoryEdit', component: () => import('../views/CategoryForm.vue'), meta: { title: '编辑分类', requiresAdmin: true } },
      { path: 'orders', name: 'OrderList', component: () => import('../views/OrderList.vue'), meta: { title: '订单管理', requiresAdmin: true } },
      { path: 'orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetail.vue'), meta: { title: '订单详情', requiresAdmin: true } },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { title: '个人中心', requiresAdmin: true } },
      { path: 'banners', name: 'BannerList', component: () => import('../views/BannerList.vue'), meta: { title: '轮播管理', requiresAdmin: true } },
      { path: 'coupons', name: 'CouponList', component: () => import('../views/CouponList.vue'), meta: { title: '优惠券管理', requiresAdmin: true } },
      { path: 'after-sales', name: 'AfterSaleList', component: () => import('../views/AfterSaleList.vue'), meta: { title: '售后工单', requiresAdmin: true } },
      { path: 'invoices', name: 'InvoiceList', component: () => import('../views/InvoiceList.vue'), meta: { title: '发票管理', requiresAdmin: true } },
      { path: 'audit-logs', name: 'AuditLog', component: () => import('../views/AuditLog.vue'), meta: { title: '操作日志', requiresAdmin: true } },
      { path: 'spec-templates', name: 'SpecTemplate', component: () => import('../views/SpecTemplate.vue'), meta: { title: '属性模板', requiresAdmin: true } },
      { path: 'purchase-orders', name: 'PurchaseOrder', component: () => import('../views/PurchaseOrder.vue'), meta: { title: '采购单', requiresAdmin: true } },
      { path: 'suppliers', name: 'SupplierList', component: () => import('../views/SupplierList.vue'), meta: { title: '供应商', requiresAdmin: true } },
      { path: 'reviews', name: 'ReviewList', component: () => import('../views/ReviewList.vue'), meta: { title: '评价管理', requiresAdmin: true } },
      { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { title: '系统设置', requiresAdmin: true } },
      { path: 'inventory', name: 'InventoryList', component: () => import('../views/InventoryList.vue'), meta: { title: '库存管理', requiresAdmin: true } },
      { path: 'reports', name: 'ReportView', component: () => import('../views/ReportView.vue'), meta: { title: '销售报表', requiresAdmin: true } },
      { path: 'roles', name: 'RoleList', component: () => import('../views/RoleList.vue'), meta: { title: '角色管理', requiresAdmin: true } },
      { path: 'logistics', name: 'LogisticsList', component: () => import('../views/LogisticsList.vue'), meta: { title: '物流管理', requiresAdmin: true } },
      { path: 'members', name: 'MemberLevel', component: () => import('../views/MemberLevel.vue'), meta: { title: '会员管理', requiresAdmin: true } },
      { path: 'backup', name: 'BackupRestore', component: () => import('../views/BackupRestore.vue'), meta: { title: '数据备份', requiresAdmin: true } },
      // 后台 404 兜底
      { path: ':pathMatch(.*)*', name: 'AdminNotFound', component: () => import('../views/NotFound.vue'), meta: { title: '404 - VeStore' } },
    ],
  },
  // 根路径重定向到后台仪表盘
  { path: '/', redirect: '/admin/dashboard' },
  // 全局 404
  { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/admin' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  // 每次导航都从 storage 恢复状态，确保 Pinia 和 request.js 的 token 同步
  auth.initFromStorage()

  const { setMeta } = useSeo()
  const title = to.meta.title ? `${to.meta.title} - VeStore Admin` : 'VeStore Admin'
  setMeta({ title, description: '' })

  if (to.meta.guest) {
    if (auth.isAdmin) return next('/admin/dashboard')
    return next()
  }
  if (to.meta.requiresAdmin) {
    if (auth.isAdmin) return next()
    return next('/admin/login')
  }
  next()
})

export default router
