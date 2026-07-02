<template>
  <div class="admin-login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">◆</span>
        <h2>Ve Admin</h2>
        <p class="login-sub">管理员后台</p>
      </div>
      <form @submit.prevent="onSubmit">
        <div class="form-group">
          <label>管理员账号</label>
          <input
            v-model="form.username"
            class="form-control"
            :class="{ 'form-control-error': errors.username }"
            placeholder="请输入管理员账号"
            autocomplete="username"
          />
          <p v-if="errors.username" class="field-error">{{ errors.username }}</p>
        </div>
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            class="form-control"
            :class="{ 'form-control-error': errors.password }"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
          <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
        </div>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      <div class="login-links">
        <router-link to="/login" class="login-link">用户登录</router-link>
        <router-link to="/" class="login-link">返回商城首页</router-link>
      </div>
      <div class="login-footer">
        <span>管理员安全登录 · Ve Admin</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { loginSchema } from '../utils/validation-schemas'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ username: '', password: '' })
const errors = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

onMounted(() => {
  if (auth.isAdmin) {
    router.push('/admin')
  }
})

function validate() {
  const result = loginSchema.safeParse(form)
  errors.username = ''
  errors.password = ''
  if (result.success) return true
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (field === 'username') errors.username = issue.message
    if (field === 'password') errors.password = issue.message
  }
  return false
}

async function onSubmit() {
  error.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await auth.adminLogin({ username: form.username, password: form.password })
    router.push('/admin')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}
.login-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 40px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-logo {
  font-size: 36px;
  display: block;
  margin-bottom: 12px;
}
.login-header h2 {
  font-size: 22px;
  font-weight: 700;
}
.login-sub {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}
.login-btn {
  width: 100%;
  justify-content: center;
  padding: 10px;
  font-size: 15px;
  margin-top: 8px;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.login-error {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}
.field-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}
.form-control-error {
  border-color: var(--danger) !important;
}
.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
.login-link {
  font-size: 13px;
  color: var(--primary);
  text-decoration: none;
}
.login-link:hover {
  text-decoration: underline;
}
.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
