<template>
  <div>
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <div class="card" style="max-width: 600px; margin-bottom: 20px">
      <h3 class="section-title">外观设置</h3>
      <div class="setting-row">
        <div>
          <div class="setting-label">主题模式</div>
          <div class="setting-desc">切换亮色/暗色主题</div>
        </div>
        <button class="btn" @click="toggleDark">
          {{ isDark ? '☀️ 亮色模式' : '🌙 暗色模式' }}
        </button>
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-label">侧边栏</div>
          <div class="setting-desc">默认展开或收起</div>
        </div>
        <button class="btn" @click="toggleSidebar">
          {{ sidebarCollapsed ? '▶ 展开侧边栏' : '◀ 收起侧边栏' }}
        </button>
      </div>
    </div>

    <div class="card" style="max-width: 600px; margin-bottom: 20px">
      <h3 class="section-title">系统信息</h3>
      <div class="info-row"><span class="info-label">应用名称</span><span>Ve Admin</span></div>
      <div class="info-row"><span class="info-label">版本号</span><span>v1.1.0</span></div>
      <div class="info-row"><span class="info-label">前端框架</span><span>Vue 3 + Vite</span></div>
      <div class="info-row"><span class="info-label">状态管理</span><span>Pinia</span></div>
      <div class="info-row"><span class="info-label">模拟后端</span><span>json-server</span></div>
    </div>

    <div class="card" style="max-width: 600px">
      <h3 class="section-title">数据管理</h3>
      <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px">
        当前数据库共有 {{ stats.userCount }} 个用户、{{ stats.productCount }} 个产品、{{
          stats.categoryCount
        }}
        个分类和 {{ stats.orderCount }} 个订单。
      </p>
      <button class="btn btn-danger" @click="handleReset">重置所有数据</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import { getDashboardStats } from '../api/dashboard'
import request from '../api/request'

const toast = useToastStore()

const isDark = ref(localStorage.getItem('theme') === 'dark')
const sidebarCollapsed = ref(localStorage.getItem('sidebar') === 'collapsed')

const stats = ref({ userCount: 0, productCount: 0, categoryCount: 0, orderCount: 0 })

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    stats.value = { ...stats.value, ...res }
  } catch {}
})

function toggleDark() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : '')
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar', sidebarCollapsed.value ? 'collapsed' : '')
}

async function handleReset() {
  if (!confirm('确认重置所有数据？此操作不可撤销！')) return
  try {
    await request.post('/db/reset')
    toast.show('所有数据已重置', 'success')
    // 刷新统计
    const res = await getDashboardStats()
    stats.value = { ...stats.value, ...res }
  } catch {
    toast.show('重置失败', 'error')
  }
}
</script>

<style scoped>
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.setting-row:last-child {
  border-bottom: none;
}
.setting-label {
  font-size: 14px;
  font-weight: 500;
}
.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.info-row {
  display: flex;
  padding: 10px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  width: 100px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
