<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('backup.title') }}</h2>
    </div>

    <div class="card" style="max-width:600px;margin-bottom:20px">
      <h3 class="section-title">{{ $t('backup.backupNow') }}</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">
        {{ $t('backup.backupDesc') }}
      </p>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" @click="doBackup">{{ $t('backup.exportBackup') }}</button>
        <button class="btn" @click="doBackupFull">{{ $t('backup.exportFull') }}</button>
      </div>
    </div>

    <div class="card" style="max-width:600px;margin-bottom:20px">
      <h3 class="section-title">{{ $t('backup.restore') }}</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">
        {{ $t('backup.restoreDesc') }}
      </p>
      <div style="display:flex;gap:8px;align-items:center">
        <input ref="fileInput" type="file" accept=".json" class="form-control" style="width:300px" @change="handleFile" />
        <button class="btn btn-warning" :disabled="!restoreData" @click="doRestore">{{ $t('backup.restore') }}</button>
      </div>
    </div>

    <div class="card" style="max-width:600px;margin-bottom:20px">
      <h3 class="section-title">{{ $t('backup.resetData') }}</h3>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">
        {{ $t('backup.resetDesc') }}
      </p>
      <button class="btn btn-danger" @click="handleReset">{{ $t('backup.resetAll') }}</button>
    </div>

    <div class="card" style="max-width:600px">
      <h3 class="section-title">{{ $t('backup.autoBackup') }}</h3>
      <div class="setting-row">
        <div>
          <div class="setting-label">{{ $t('backup.autoBackupSwitch') }}</div>
          <div class="setting-desc">{{ $t('backup.autoBackupDesc') }}</div>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="autoBackup" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToastStore } from '../stores/toast'
import request from '../api/request'
import Toast from '../components/Toast.vue'

const toast = useToastStore()
const fileInput = ref(null)
const restoreData = ref(null)
const autoBackup = ref(localStorage.getItem('auto_backup') === 'true')

async function doBackup() {
  try {
    const resources = ['users', 'products', 'categories', 'orders', 'coupons', 'suppliers', 'banners']
    const data = {}
    for (const r of resources) {
      const res = await request.get(`/${r}`, { params: { _limit: 9999 } })
      data[r] = res.list || res
    }
    downloadJSON(`ve_backup_${new Date().toISOString().slice(0,10)}.json`, data)
    toast.show('备份成功', 'success')
  } catch { toast.show('备份失败', 'error') }
}

async function doBackupFull() {
  try {
    const res = await request.get('/db')
    downloadJSON(`ve_full_backup_${new Date().toISOString().slice(0,10)}.json`, res)
    toast.show('全量备份成功', 'success')
  } catch {
    // 降级为普通备份
    doBackup()
  }
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      restoreData.value = JSON.parse(ev.target.result)
      toast.show(`文件加载成功，包含 ${Object.keys(restoreData.value).length} 个数据表`, 'success')
    } catch {
      toast.show('文件格式错误', 'error')
    }
  }
  reader.readAsText(file)
}

async function doRestore() {
  if (!restoreData.value) return
  if (!confirm('恢复数据将覆盖现有数据，确定继续？')) return
  try {
    for (const [key, items] of Object.entries(restoreData.value)) {
      if (Array.isArray(items)) {
        await request.post(`/db/restore`, { resource: key, data: items })
      }
    }
    toast.show('数据恢复成功', 'success')
    restoreData.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch {
    toast.show('恢复失败，请检查数据格式', 'error')
  }
}

async function handleReset() {
  if (!confirm('确认重置所有数据？此操作不可撤销！')) return
  try {
    await request.post('/db/reset')
    toast.show('所有数据已重置', 'success')
  } catch {
    toast.show('重置失败', 'error')
  }
}
</script>

<style scoped>
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
.setting-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.setting-label { font-size: 14px; font-weight: 500; }
.setting-desc { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.switch { position: relative; display: inline-block; width: 48px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 26px; transition: 0.3s; }
.slider::before { content: ''; position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
input:checked + .slider { background: var(--primary); }
input:checked + .slider::before { transform: translateX(22px); }
.btn-warning { background: #f59e0b; color: #fff; border-color: #f59e0b; }
.btn-warning:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
