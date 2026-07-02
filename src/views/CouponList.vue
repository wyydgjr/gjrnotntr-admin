<template>
  <div>
    <div class="page-header">
      <h2>优惠券管理</h2>
      <button
        class="btn btn-primary"
        @click="openAddForm"
      >
        新增优惠券
      </button>
    </div>
    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无优惠券">
      <template #actions="{ row }"
        ><button class="btn btn-sm btn-danger" @click="del(row)">删除</button></template
      >
    </DataTable>
    <Modal v-if="showForm" @close="showForm = false">
      <template #header>{{ editing ? '编辑' : '新增' }}优惠券</template>
      <template #body>
        <div class="form-group">
          <label>名称</label><input v-model="form.name" class="form-control" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
          <div class="form-group">
            <label>面额(元)</label
            ><input v-model.number="form.discount" type="number" class="form-control" />
          </div>
          <div class="form-group">
            <label>最低消费</label
            ><input v-model.number="form.minAmount" type="number" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label>有效期至</label><input v-model="form.expireAt" type="date" class="form-control" />
        </div>
      </template>
      <template #footer>
        <button class="btn btn-primary" @click="save">保存</button
        ><button class="btn" @click="showForm = false">取消</button>
      </template>
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
const editing = ref(null)
const form = ref({ name: '', discount: 10, minAmount: 99, expireAt: '' })
const columns = [
  { key: 'name', label: '名称' },
  { key: 'discount', label: '面额' },
  { key: 'minAmount', label: '最低消费' },
  { key: 'expireAt', label: '有效期' },
]
onMounted(load)
async function load() {
  loading.value = true
  try {
    const r = await request.get('/coupons')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
}
function openAddForm() { showForm.value = true; editing.value = null; resetForm() }
function resetForm() {
  form.value = { name: '', discount: 10, minAmount: 99, expireAt: '' }
}
async function save() {
  try {
    await request.post('/coupons', form.value)
    toast.show('保存成功', 'success')
    showForm.value = false
    await load()
  } catch {
    toast.show('保存失败', 'error')
  }
}
async function del(row) {
  if (!confirm(`删除「${row.name}」？`)) return
  try {
    await request.delete(`/coupons/${row.id}`)
    toast.show('已删除', 'success')
    await load()
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
