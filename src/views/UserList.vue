<template>
  <div>
    <div class="page-header">
      <h2>用户管理</h2>
      <div style="display: flex; gap: 10px; align-items: center">
        <span v-if="autoRefresh" class="refresh-badge">🔄 自动刷新中</span>
        <button class="btn btn-sm" @click="toggleAutoRefresh">
          {{ autoRefresh ? '暂停刷新' : '开启自动刷新' }}
        </button>
        <button class="btn" @click="doExport">📥 导出Excel</button>
        <router-link to="/admin/users/new" class="btn btn-primary">新增用户</router-link>
      </div>
    </div>

    <div style="margin-bottom: 16px">
      <SearchBar placeholder="搜索用户名或邮箱..." @search="handleSearch" />
    </div>

    <DataTable
      :columns="columns"
      :items="store.list"
      :loading="store.loading"
      empty-text="暂无用户数据"
    >
      <template #actions="{ row }">
        <router-link :to="`/admin/users/${row.id}/edit`" class="btn btn-sm">编辑</router-link>
        <button class="btn btn-sm btn-danger" @click="handleDelete(row)">删除</button>
      </template>
    </DataTable>

    <Pagination
      v-if="store.total > pageSize"
      :total="store.total"
      v-model="page"
      :page-size="pageSize"
      @change="loadData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'
import { exportExcel } from '../utils/export'

const store = useResourceStore('users', '/users')
const toast = useToastStore()
const page = ref(1)
const pageSize = 20

// ── 自动刷新 ──
const autoRefresh = ref(true)
let refreshTimer = null
const REFRESH_INTERVAL = 30000

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    store.fetchList({ page: page.value, pageSize, keyword: store.query.keyword || '' })
  }, REFRESH_INTERVAL)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: '用户名' },
  { key: 'email', label: '邮箱' },
  {
    key: 'role',
    label: '角色',
    badge: true,
    htmlClass: (r) => (r.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'),
    render: (r) => (r.role === 'admin' ? '管理员' : '用户'),
  },
  {
    key: 'status',
    label: '状态',
    badge: true,
    htmlClass: (r) => (r.status === 'active' ? 'badge badge-active' : 'badge badge-inactive'),
    render: (r) => (r.status === 'active' ? '启用' : '停用'),
  },
  { key: 'createdAt', label: '创建时间' },
]

onMounted(() => {
  store.fetchList()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

watch(page, () => loadData())

function loadData() {
  store.fetchList({ page: page.value, pageSize })
}

function handleSearch(keyword) {
  page.value = 1
  store.fetchList({ keyword, page: 1, pageSize })
}

async function handleDelete(row) {
  if (!confirm(`确认删除用户「${row.username}」？`)) return
  try {
    await store.remove(row.id)
    toast.show('用户已删除', 'success')
  } catch {
    toast.show('删除失败', 'error')
  }
}
function doExport() {
  exportExcel(
    store.list.map((u) => ({
      ID: u.id,
      用户名: u.username,
      邮箱: u.email,
      角色: u.role === 'admin' ? '管理员' : '用户',
      状态: u.status === 'active' ? '启用' : '停用',
      创建时间: u.createdAt,
    })),
    '用户管理',
  )
}
</script>

<style scoped>
.refresh-badge {
  font-size: 12px;
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
}
</style>
