<template>
  <div>
    <div class="page-header"><h2>发票管理</h2></div>
    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无发票申请">
      <template #actions="{ row }">
        <button
          v-if="row.status === 'pending'"
          class="btn btn-sm btn-primary"
          @click="updateStatus(row, 'done')"
        >
          确认开票
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
const columns = [
  { key: 'orderId', label: '订单号' },
  { key: 'title', label: '抬头' },
  { key: 'taxId', label: '税号' },
  {
    key: 'status',
    label: '状态',
    badge: true,
    htmlClass: (r) => `badge badge-${r.status}`,
    render: (r) => (r.status === 'done' ? '已开票' : '待开票'),
  },
]
onMounted(load)
async function load() {
  loading.value = true
  try {
    const r = await request.get('/invoices')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
}
async function updateStatus(row, status) {
  try {
    await request.put(`/invoices/${row.id}`, { ...row, status })
    toast.show('已更新', 'success')
    await load()
  } catch {
    toast.show('操作失败', 'error')
  }
}
</script>
