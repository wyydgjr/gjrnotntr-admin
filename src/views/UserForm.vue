<template>
  <div>
    <div class="page-header">
      <h2>{{ isEdit ? '编辑用户' : '新增用户' }}</h2>
    </div>

    <div class="card" style="max-width: 520px">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            class="form-control"
            :class="{ error: errors.username }"
            required
          />
          <p v-if="errors.username" class="form-error">{{ errors.username }}</p>
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="form.email"
            class="form-control"
            type="email"
            :class="{ error: errors.email }"
            required
          />
          <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
        </div>
        <div class="form-group" v-if="!isEdit">
          <label>密码</label>
          <input
            v-model="form.password"
            class="form-control"
            type="password"
            :class="{ error: errors.password }"
            required
          />
          <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
        </div>
        <div class="form-group">
          <label>角色</label>
          <select v-model="form.role" class="form-control">
            <option value="user">用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="form.status" class="form-control">
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 24px">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '保存' }}
          </button>
          <router-link to="/admin/users" class="btn">取消</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const store = useResourceStore('users', '/users')
const toast = useToastStore()

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const errors = reactive({})

const form = ref({
  username: '',
  email: '',
  password: '',
  role: 'user',
  status: 'active',
})

onMounted(() => {
  if (isEdit.value) loadUser()
})

watch(
  () => route.params.id,
  () => {
    if (route.params.id) loadUser()
    else resetForm()
  },
)

function validate() {
  const errs = {}
  if (!form.value.username.trim()) errs.username = '请输入用户名'
  if (!form.value.email.trim()) errs.email = '请输入邮箱'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errs.email = '邮箱格式不正确'
  if (!isEdit.value && !form.value.password) errs.password = '请输入密码'
  else if (!isEdit.value && form.value.password.length < 3) errs.password = '密码至少3个字符'
  Object.assign(errors, errs)
  return Object.keys(errs).length === 0
}

async function loadUser() {
  try {
    await store.fetchById(route.params.id)
    if (store.current) {
      form.value = { ...store.current }
      form.value.password = ''
    }
  } catch {
    toast.show('加载用户失败', 'error')
    router.push('/admin/users')
  }
}

function resetForm() {
  form.value = { username: '', email: '', password: '', role: 'user', status: 'active' }
  Object.keys(errors).forEach((k) => delete errors[k])
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = { ...form.value }
    if (isEdit.value && !payload.password) delete payload.password
    await store.save(payload)
    toast.show(isEdit.value ? '用户已更新' : '用户已创建', 'success')
    router.push('/admin/users')
  } catch {
    toast.show('保存失败', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
