<template>
  <div>
    <div class="page-header">
      <h2>{{ isEdit ? '编辑分类' : '新增分类' }}</h2>
    </div>

    <div class="card" style="max-width: 520px">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>分类名称</label>
          <input
            v-model="form.name"
            class="form-control"
            :class="{ error: errors.name }"
            required
          />
          <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea
            v-model="form.description"
            class="form-control"
            rows="3"
            placeholder="请输入分类描述"
          ></textarea>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 24px">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '保存' }}
          </button>
          <router-link to="/admin/categories" class="btn">取消</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const store = useResourceStore('categories', '/categories')
const toast = useToastStore()

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const errors = ref({})

const form = ref({
  name: '',
  description: '',
})

onMounted(() => {
  if (isEdit.value) loadCategory()
})

watch(
  () => route.params.id,
  () => {
    if (route.params.id) loadCategory()
    else resetForm()
  },
)

function validate() {
  const errs = {}
  if (!form.value.name.trim()) errs.name = '请输入分类名称'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function loadCategory() {
  try {
    await store.fetchById(route.params.id)
    if (store.current) form.value = { ...store.current }
  } catch {
    toast.show('加载分类失败', 'error')
    router.push('/admin/categories')
  }
}

function resetForm() {
  form.value = { name: '', description: '' }
  errors.value = {}
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await store.save(form.value)
    toast.show(isEdit.value ? '分类已更新' : '分类已创建', 'success')
    router.push('/admin/categories')
  } catch {
    toast.show('保存失败', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
