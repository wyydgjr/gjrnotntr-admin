<template>
  <div class="layout" :class="{ dark: isDark }">
    <aside
      class="sidebar"
      :class="{ collapsed: sidebarCollapsed }"
      role="navigation"
      aria-label="侧边导航"
    >
      <div class="sidebar-logo">
        <span class="logo-icon">◆</span>
        <span v-show="!sidebarCollapsed" class="logo-text">Ve Admin</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path.startsWith(item.path) }"
          :aria-label="$t(item.i18n)"
          :aria-current="route.path.startsWith(item.path) ? 'page' : undefined"
        >
          <span class="nav-icon">{{ item.label }}</span>
          <span v-show="!sidebarCollapsed">{{ $t(item.i18n) }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <span v-if="sidebarCollapsed">▶</span>
          <span v-else>◀</span>
        </button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">☰</button>
          <h3 class="topbar-title">{{ route.meta?.title || 'Ve Admin' }}</h3>
        </div>
        <div class="topbar-right">
          <LocaleSwitcher />
          <button
            class="btn btn-sm btn-icon"
            @click="toggleDark"
            :title="isDark ? '切换亮色模式' : '切换暗色模式'"
          >
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <router-link to="/" class="btn btn-sm" style="margin-right: 4px">返回前台</router-link>
          <router-link to="/admin/profile" class="user-name">{{
            auth.effectiveUser?.username || 'Admin'
          }}</router-link>
          <router-link to="/admin/settings" class="btn btn-sm btn-icon" title="系统设置"
            >⚙️</router-link
          >
          <button class="btn btn-sm" @click="handleLogout">{{ $t('auth.logout') }}</button>
        </div>
      </header>
      <main class="content" id="main-content" role="main">
        <router-view />
      </main>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Toast from '../components/Toast.vue'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isDark = ref(localStorage.getItem('theme') === 'dark')
const sidebarCollapsed = ref(localStorage.getItem('sidebar') === 'collapsed')

watch(isDark, (v) => {
  localStorage.setItem('theme', v ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', v ? 'dark' : '')
})

watch(sidebarCollapsed, (v) => {
  localStorage.setItem('sidebar', v ? 'collapsed' : '')
})

if (isDark.value) {
  document.documentElement.setAttribute('data-theme', 'dark')
}

const navItems = [
  { path: '/admin/dashboard', label: '📊', i18n: 'nav.dashboard' },
  { path: '/admin/users', label: '👥', i18n: 'nav.userManagement' },
  { path: '/admin/orders', label: '📋', i18n: 'nav.orderManagement' },
  { path: '/admin/products', label: '📦', i18n: 'nav.productManagement' },
  { path: '/admin/inventory', label: '📉', i18n: 'nav.inventory' },
  { path: '/admin/categories', label: '📂', i18n: 'nav.categoryManagement' },
  { path: '/admin/reports', label: '📈', i18n: 'nav.reports' },
  { path: '/admin/logistics', label: '🚚', i18n: 'nav.logistics' },
  { path: '/admin/members', label: '👑', i18n: 'nav.members' },
  { path: '/admin/coupons', label: '🎫', i18n: 'nav.coupons' },
  { path: '/admin/banners', label: '🎠', i18n: 'nav.bannerManagement' },
  { path: '/admin/after-sales', label: '🔄', i18n: 'nav.afterSales' },
  { path: '/admin/invoices', label: '🧾', i18n: 'nav.invoices' },
  { path: '/admin/reviews', label: '⭐', i18n: 'nav.reviewManagement' },
  { path: '/admin/suppliers', label: '🏭', i18n: 'nav.supplier' },
  { path: '/admin/purchase-orders', label: '📥', i18n: 'nav.purchaseOrder' },
  { path: '/admin/spec-templates', label: '🏷️', i18n: 'nav.specTemplate' },
  { path: '/admin/roles', label: '🔐', i18n: 'nav.roles' },
  { path: '/admin/audit-logs', label: '📝', i18n: 'nav.auditLog' },
  { path: '/admin/backup', label: '💾', i18n: 'nav.backup' },
  { path: '/admin/settings', label: '⚙️', i18n: 'nav.settings' },
]

function toggleDark() {
  isDark.value = !isDark.value
}

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 240px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.2s;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 64px;
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
}
.logo-icon {
  font-size: 22px;
}
.logo-text {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}
.sidebar-nav {
  padding: 12px 10px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 6px;
  color: var(--sidebar-text);
  font-size: 14px;
  margin-bottom: 2px;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  text-decoration: none;
}
.nav-item.active {
  background: var(--sidebar-active);
  color: #fff;
}
.nav-icon {
  font-size: 16px;
  min-width: 20px;
  text-align: center;
}
.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.collapse-btn {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 6px;
  color: var(--sidebar-text);
  cursor: pointer;
  font-size: 14px;
}
.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar-title {
  font-size: 16px;
  font-weight: 600;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-name {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  text-decoration: none;
}
.user-name:hover {
  color: var(--primary);
  text-decoration: none;
}
.btn-icon {
  min-width: 34px;
  justify-content: center;
}
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text);
  padding: 4px;
}
.content {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
}
@media (max-width: 768px) {
  .sidebar:not(.collapsed) {
    width: 200px;
  }
  .sidebar.collapsed {
    width: 0;
    padding: 0;
  }
  .mobile-menu-btn {
    display: block;
  }
  .topbar {
    padding: 12px 16px;
  }
  .content {
    padding: 16px;
  }
}
</style>
