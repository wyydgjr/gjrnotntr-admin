<template>
  <div>
    <div class="page-header">
      <h2>供应商管理</h2>
      <button
        class="btn btn-primary"
        @click="openAddForm"
      >
        新增供应商
      </button>
    </div>
    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无供应商">
      <template #actions="{ row }"
        ><button class="btn btn-sm btn-danger" @click="del(row)">删除</button></template
      >
    </DataTable>
    <Modal v-if="showForm" @close="showForm = false">
      <template #header>新增供应商</template>
      <template #body>
        <div class="form-group">
          <label>名称</label><input v-model="form.name" class="form-control" />
        </div>
        <div class="form-group">
          <label>联系人</label><input v-model="form.contact" class="form-control" />
        </div>
        <div class="form-group">
          <label>电话</label><input v-model="form.phone" class="form-control" />
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
const form = ref({ name: '', contact: '', phone: '' })
const columns = [
  { key: 'name', label: '名称' },
  { key: 'contact', label: '联系人' },
  { key: 'phone', label: '电话' },
]
onMounted(load)
async function load() {
  loading.value = true
  try {
    const r = await request.get('/suppliers')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
}
function openAddForm() { showForm.value = true; resetForm() }
function resetForm() {
  form.value = { name: '', contact: '', phone: '' }
}
async function save() {
  try {
    await request.post('/suppliers', form.value)
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
    await request.delete(`/suppliers/${row.id}`)
    toast.show('已删除', 'success')
    await load()
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
