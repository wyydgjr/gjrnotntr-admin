<template>
  <div>
    <div class="page-header">
      <h2>订单管理</h2>
      <button class="btn" @click="doExport">📥 导出Excel</button>
    </div>

    <div
      style="margin-bottom: 16px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap"
    >
      <SearchBar placeholder="搜索订单号或用户名..." @search="handleSearch" />
      <select
        v-model="statusFilter"
        class="form-control"
        style="width: auto"
        @change="handleFilter"
      >
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="shipped">已发货</option>
        <option value="completed">已完成</option>
        <option value="cancelled">已取消</option>
      </select>
    </div>

    <DataTable
      :columns="columns"
      :items="store.list"
      :loading="store.loading"
      empty-text="暂无订单数据"
    >
      <template #actions="{ row }">
        <router-link :to="`/orders/${row.id}`" class="btn btn-sm">查看</router-link>
        <button
          v-if="row.status === 'pending'"
          class="btn btn-sm btn-primary"
          @click="handleStatus(row, 'shipped')"
        >
          发货
        </button>
        <button
          v-if="row.status === 'pending' || row.status === 'shipped'"
          class="btn btn-sm btn-danger"
          @click="handleStatus(row, 'cancelled')"
        >
          取消
        </button>
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
import { ref, onMounted, watch } from 'vue'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'
import { exportExcel, exportWord } from '../utils/export'

const store = useResourceStore('orders', '/orders')
const toast = useToastStore()
const page = ref(1)
const pageSize = 20
const statusFilter = ref('')

const statusMap = {
  pending: '待处理',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}
function doExport() {
  exportExcel(
    store.list.map((o) => ({
      订单号: o.id,
      用户: o.userName,
      金额: o.total,
      状态: statusMap[o.status] || o.status,
      地址: o.address,
      时间: o.createdAt,
    })),
    '订单管理',
  )
}

const columns = [
  { key: 'id', label: '订单号' },
  { key: 'userName', label: '用户' },
  { key: 'total', label: '金额', render: (r) => `¥${r.total.toLocaleString()}` },
  {
    key: 'status',
    label: '状态',
    badge: true,
    htmlClass: (r) => {
      const cls =
        r.status === 'pending'
          ? 'badge-pending'
          : r.status === 'shipped'
            ? 'badge-shipped'
            : r.status === 'completed'
              ? 'badge-completed'
              : 'badge-cancelled'
      return `badge ${cls}`
    },
    render: (r) => statusMap[r.status] || r.status,
  },
  { key: 'createdAt', label: '创建时间' },
]

onMounted(() => store.fetchList())

watch(page, () => loadData())

function loadData() {
  store.fetchList({ page: page.value, pageSize, status: statusFilter.value || undefined })
}

function handleSearch(keyword) {
  page.value = 1
  store.fetchList({ keyword, page: 1, pageSize, status: statusFilter.value || undefined })
}

function handleFilter() {
  page.value = 1
  store.fetchList({ page: 1, pageSize, status: statusFilter.value || undefined })
}

async function handleStatus(row, newStatus) {
  const statusText = statusMap[newStatus]
  if (!confirm(`确认将订单 #${row.id} 标记为「${statusText}」？`)) return
  try {
    await store.save({ ...row, status: newStatus })
    toast.show(`订单已${statusText}`, 'success')
    loadData()
  } catch {
    toast.show('操作失败', 'error')
  }
}
</script>
