<template>
  <div>
    <div class="page-header">
      <h2>个人中心</h2>
    </div>

    <div class="profile-grid">
      <div class="card profile-card">
        <div class="avatar-section">
          <div class="avatar" @click="triggerAvatar" :title="$t('upload.clickToChange')">
            <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="avatar-img" />
            <span v-else class="avatar-text">◆</span>
            <div class="avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onAvatarChange"
          />
          <h3>{{ auth.effectiveUser?.username }}</h3>
          <span
            class="badge"
            :class="auth.effectiveUser?.role === 'admin' ? 'badge-admin' : 'badge-user'"
          >
            {{ auth.effectiveUser?.role === 'admin' ? '管理员' : '用户' }}
          </span>
        </div>
      </div>

      <div class="card" style="flex: 1">
        <h3 class="section-title">编辑资料</h3>
        <form @submit.prevent="handleSubmit" style="max-width: 480px">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="form.username" class="form-control" required />
            <p v-if="errors.username" class="form-error">{{ errors.username }}</p>
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="form.email" class="form-control" type="email" required />
            <p v-if="errors.email" class="form-error">{{ errors.email }}</p>
          </div>
          <div class="form-group">
            <label>新密码（留空则不修改）</label>
            <input
              v-model="form.password"
              class="form-control"
              type="password"
              placeholder="不修改请留空"
            />
          </div>
          <div style="margin-top: 24px">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import request from '../api/request'

const auth = useAuthStore()
const toast = useToastStore()
const submitting = ref(false)
const errors = reactive({})
const avatarInput = ref(null)
const avatarUrl = ref('')

const form = ref({
  username: '',
  email: '',
  password: '',
})

onMounted(() => {
  const u = auth.effectiveUser
  if (u) {
    form.value.username = u.username || ''
    form.value.email = u.email || ''
    avatarUrl.value = u.avatar || ''
  }
})

function triggerAvatar() {
  avatarInput.value?.click()
}

async function onAvatarChange(e) {
  const file = e.target?.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.show('请选择图片文件', 'error')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.show('头像不能超过 2MB', 'error')
    return
  }
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    avatarUrl.value = res.url
    // 同步更新到用户资料
    await auth.updateProfile({ avatar: res.url })
    toast.show('头像已更新', 'success')
  } catch (e) {
    toast.show(e?.message || '上传失败', 'error')
  } finally {
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

function validate() {
  const errs = {}
  if (!form.value.username.trim()) errs.username = '用户名不能为空'
  if (!form.value.email.trim()) errs.email = '邮箱不能为空'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errs.email = '邮箱格式不正确'
  Object.assign(errors, errs)
  return Object.keys(errs).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload = { username: form.value.username, email: form.value.email }
    if (form.value.password) payload.password = form.value.password
    await auth.updateProfile(payload)
    toast.show('个人资料已更新', 'success')
    form.value.password = ''
  } catch {
    toast.show('保存失败', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.profile-grid {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}
@media (max-width: 768px) {
  .profile-grid {
    flex-direction: column;
  }
}
.profile-card {
  width: 260px;
  text-align: center;
  flex-shrink: 0;
}
.avatar-section {
  padding: 16px 0;
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-text {
  z-index: 1;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatar:hover .avatar-overlay {
  opacity: 1;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.avatar-section h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
</style>
