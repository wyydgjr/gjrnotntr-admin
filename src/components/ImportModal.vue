<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="import-hint">请上传 .xlsx 文件，第一行为表头，从第二行开始为数据</div>
        <div
          class="drop-zone"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="$refs.file.click()"
        >
          <span v-if="!file">{{ hint }}</span>
          <span v-else class="file-name">✅ {{ file.name }}</span>
        </div>
        <input ref="file" type="file" accept=".xlsx,.xls" hidden @change="handleFile" />
        <div v-if="preview.length" class="import-preview">
          <p class="preview-title">预览（前3行）：</p>
          <table>
            <thead>
              <tr>
                <th v-for="h in headers" :key="h">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in preview" :key="i">
                <td v-for="h in headers" :key="h">{{ r[h] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="error" class="import-error">{{ error }}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" :disabled="!file || uploading" @click="doImport">
          {{ uploading ? '导入中...' : '确认导入' }}
        </button>
        <button class="btn" @click="$emit('close')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import request from '../api/request'

const props = defineProps({
  title: { type: String, default: '导入数据' },
  apiPath: String,
  hint: { type: String, default: '点击或拖拽上传 Excel 文件' },
})
const emit = defineEmits(['close', 'done'])

const file = ref(null)
const data = ref([])
const headers = ref([])
const preview = ref([])
const error = ref('')
const uploading = ref(false)

function handleFile(e) {
  const f = e.target.files[0]
  if (f) parseFile(f)
}

function handleDrop(e) {
  const f = e.dataTransfer.files[0]
  if (f) parseFile(f)
}

function parseFile(f) {
  file.value = f
  error.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(ws)
      if (!json.length) {
        error.value = '文件为空'
        return
      }
      headers.value = Object.keys(json[0])
      data.value = json
      preview.value = json.slice(0, 3)
    } catch {
      error.value = '文件解析失败，请确认是 .xlsx 格式'
    }
  }
  reader.readAsArrayBuffer(f)
}

async function doImport() {
  if (!data.value.length) return
  uploading.value = true
  error.value = ''
  let success = 0,
    fail = 0
  for (const row of data.value) {
    try {
      await request.post(props.apiPath, row)
      success++
    } catch {
      fail++
    }
  }
  uploading.value = false
  emit('done', { success, fail })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: var(--bg-card);
  border-radius: 12px;
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
}
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}
.import-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.drop-zone {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  transition: border-color 0.15s;
}
.drop-zone:hover {
  border-color: var(--primary);
}
.file-name {
  color: var(--success);
  font-weight: 600;
}
.import-preview {
  margin-top: 16px;
}
.preview-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.import-preview table {
  width: 100%;
  font-size: 12px;
}
.import-preview th,
.import-preview td {
  padding: 6px 8px;
  border: 1px solid var(--border);
}
.import-preview th {
  background: var(--bg);
  font-weight: 600;
}
.import-error {
  color: var(--danger);
  font-size: 13px;
  margin-top: 10px;
}
</style>
