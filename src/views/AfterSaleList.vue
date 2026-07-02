<template>
  <div>
    <div class="page-header"><h2>售后工单</h2></div>
    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无售后">
      <template #actions="{ row }">
        <button
          v-if="row.status === 'pending'"
          class="btn btn-sm btn-primary"
          @click="updateStatus(row, 'approved')"
        >
          通过
        </button>
        <button
          v-if="row.status === 'pending'"
          class="btn btn-sm btn-danger"
          @click="updateStatus(row, 'rejected')"
        >
          拒绝
        </button>
        <button
          v-if="row.status === 'approved'"
          class="btn btn-sm"
          @click="updateStatus(row, 'done')"
        >
          完成
        </button>
      </template>
    </DataTable>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import request from '../api/request'
const toast = useToastStore()
const list = ref([])
const loading = ref(true)
const statusMap = { pending: '处理中', approved: '已通过', rejected: '已拒绝', done: '已完成' }
const columns = [
  { key: 'orderId', label: '订单号' },
  {
    key: 'type',
    label: '类型',
    render: (r) => ({ refund: '仅退款', return: '退货退款', exchange: '换货' })[r.type] || r.type,
  },
  { key: 'reason', label: '原因' },
  {
    key: 'status',
    label: '状态',
    badge: true,
    htmlClass: (r) => `badge badge-${r.status}`,
    render: (r) => statusMap[r.status] || r.status,
  },
]
onMounted(load)
async function load() {
  loading.value = true
  try {
    const r = await request.get('/after-sales')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
}
async function updateStatus(row, status) {
  try {
    await request.put(`/after-sales/${row.id}`, { ...row, status })
    toast.show('已更新', 'success')
    await load()
  } catch {
    toast.show('操作失败', 'error')
  }
}
</script>
