<template>
  <div>
    <div class="page-header">
      <h2>采购单管理</h2>
      <button
        class="btn btn-primary"
        @click="openAddForm"
      >
        新增采购单
      </button>
    </div>
    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无采购单">
      <template #actions="{ row }">
        <button
          v-if="row.status === 'pending'"
          class="btn btn-sm btn-primary"
          @click="updateStatus(row, 'ordered')"
        >
          已下单
        </button>
        <button
          v-if="row.status === 'ordered'"
          class="btn btn-sm"
          @click="updateStatus(row, 'received')"
        >
          已入库
        </button>
      </template>
    </DataTable>
    <Modal v-if="showForm" @close="showForm = false">
      <template #header>新增采购单</template>
      <template #body>
        <div class="form-group">
          <label>商品名称</label><input v-model="form.productName" class="form-control" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div class="form-group">
            <label>数量</label
            ><input v-model.number="form.qty" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label>单价</label
            ><input v-model.number="form.price" type="number" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label>供应商</label><input v-model="form.supplier" class="form-control" />
        </div>
      </template>
      <template #footer
        ><button class="btn btn-primary" @click="save">保存</button
        ><button class="btn" @click="showForm = false">取消</button></template
      >
    </Modal>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import Modal from '../components/Modal.vue'
import request from '../api/request'
const toast = useToastStore()
const list = ref([])
const loading = ref(true)
const showForm = ref(false)
const form = ref({ productName: '', qty: 1, price: 0, supplier: '' })
const columns = [
  { key: 'productName', label: '商品' },
  { key: 'qty', label: '数量' },
  { key: 'price', label: '单价' },
  { key: 'supplier', label: '供应商' },
  {
    key: 'status',
    label: '状态',
    render: (r) =>
      ({ pending: '待下单', ordered: '已下单', received: '已入库' })[r.status] || r.status,
  },
]
onMounted(load)
async function load() {
  loading.value = true
  try {
    const r = await request.get('/purchase-orders')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
}
function openAddForm() { showForm.value = true; resetForm() }
function resetForm() {
  form.value = { productName: '', qty: 1, price: 0, supplier: '' }
}
async function save() {
  try {
    await request.post('/purchase-orders', form.value)
    toast.show('保存成功', 'success')
    showForm.value = false
    await load()
  } catch {
    toast.show('保存失败', 'error')
  }
}
async function updateStatus(row, status) {
  try {
    await request.put(`/purchase-orders/${row.id}`, { ...row, status })
    toast.show('已更新', 'success')
    await load()
  } catch {
    toast.show('操作失败', 'error')
  }
}
</script>
