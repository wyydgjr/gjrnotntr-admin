<template>
  <div>
    <div class="page-header">
      <h2>轮播管理</h2>
      <button
        class="btn btn-primary"
        @click="openAddForm"
      >
        新增轮播
      </button>
    </div>

    <DataTable :columns="columns" :items="list" :loading="loading" empty-text="暂无轮播">
      <template #actions="{ row }">
        <button class="btn btn-sm" @click="editItem(row)">编辑</button>
        <button class="btn btn-sm btn-danger" @click="delItem(row)">删除</button>
      </template>
    </DataTable>

    <Modal v-if="showForm" @close="showForm = false">
      <template #header>{{ editing ? '编辑轮播' : '新增轮播' }}</template>
      <template #body>
        <div class="form-group">
          <label>标题</label><input v-model="form.title" class="form-control" />
        </div>
        <div class="form-group">
          <label>副标题</label><input v-model="form.subtitle" class="form-control" />
        </div>
        <div class="form-group">
          <label>轮播图片</label>
          <ImageUploader v-model="form.image" :aspect-ratio="1920 / 600" />
        </div>
        <div class="form-group">
          <label>链接</label><input v-model="form.link" class="form-control" />
        </div>
        <div class="form-group">
          <label>排序</label><input v-model.number="form.sort" class="form-control" type="number" />
        </div>
      </template>
      <template #footer>
        <button class="btn btn-primary" @click="saveItem">保存</button>
        <button class="btn" @click="showForm = false">取消</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import Modal from '../components/Modal.vue'
import ImageUploader from '../components/ImageUploader.vue'

const store = useResourceStore('banners', '/banners')
const toast = useToastStore()
const list = ref([])
const loading = ref(true)
const showForm = ref(false)
const editing = ref(null)
const form = ref({ title: '', subtitle: '', image: '', link: '', sort: 1 })

const columns = [
  { key: 'title', label: '标题' },
  { key: 'subtitle', label: '副标题' },
  { key: 'sort', label: '排序' },
  { key: 'link', label: '链接' },
]

onMounted(load)

async function load() {
  loading.value = true
  try {
    await store.fetchList()
    list.value = (store.list || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } catch {}
  loading.value = false
}

function openAddForm() { showForm.value = true; editing.value = null; resetForm() }
function resetForm() {
  form.value = { title: '', subtitle: '', image: '', link: '', sort: 1 }
}

function editItem(row) {
  editing.value = row
  form.value = { ...row }
  showForm.value = true
}

async function saveItem() {
  try {
    if (editing.value) await store.save({ ...form.value, id: editing.value.id })
    else await store.save(form.value)
    toast.show('保存成功', 'success')
    showForm.value = false
    editing.value = null
    resetForm()
    await load()
  } catch {
    toast.show('保存失败', 'error')
  }
}

async function delItem(row) {
  if (!confirm(`删除轮播「${row.title}」？`)) return
  try {
    await store.remove(row.id)
    toast.show('已删除', 'success')
    await load()
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
