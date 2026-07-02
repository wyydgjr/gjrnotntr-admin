<template>
  <div>
    <div class="page-header">
      <h2>商品属性模板</h2>
      <button
        class="btn btn-primary"
        @click="openAddForm"
      >
        新增模板
      </button>
    </div>
    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无模板">
      <template #actions="{ row }"
        ><button class="btn btn-sm btn-danger" @click="del(row)">删除</button></template
      >
    </DataTable>
    <Modal v-if="showForm" @close="showForm = false">
      <template #header>新增属性模板</template>
      <template #body>
        <div class="form-group">
          <label>模板名称</label><input v-model="form.name" class="form-control" />
        </div>
        <div class="form-group">
          <label>属性（逗号分隔）</label
          ><input v-model="form.specs" class="form-control" placeholder="如: 红色,蓝色,黑色" />
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
const form = ref({ name: '', specs: '' })
const columns = [
  { key: 'name', label: '名称' },
  { key: 'specs', label: '属性值' },
]
onMounted(load)
async function load() {
  loading.value = true
  try {
    const r = await request.get('/spec-templates')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
}
function openAddForm() { showForm.value = true; resetForm() }
function resetForm() {
  form.value = { name: '', specs: '' }
}
async function save() {
  try {
    await request.post('/spec-templates', form.value)
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
    await request.delete(`/spec-templates/${row.id}`)
    toast.show('已删除', 'success')
    await load()
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
