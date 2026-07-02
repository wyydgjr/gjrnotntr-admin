<template>
  <div class="image-uploader">
    <!-- 已有图片预览 -->
    <div v-if="modelValue" class="preview-area">
      <img :src="modelValue" alt="预览" class="preview-img" />
      <div class="preview-actions">
        <button type="button" class="btn btn-sm" @click="triggerInput">更换</button>
        <button type="button" class="btn btn-sm btn-danger" @click="removeImage">删除</button>
      </div>
    </div>

    <!-- 上传区域 -->
    <div
      v-else
      class="upload-zone"
      :class="{ dragging: isDragging, uploading: uploading, error: errorMsg }"
      @click="triggerInput"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="uploading" class="upload-status">
        <div class="spinner"></div>
        <span>{{ $t('upload.uploading') }} {{ progress }}%</span>
      </div>
      <template v-else>
        <span class="upload-icon">📷</span>
        <span class="upload-text">{{ $t('upload.clickOrDrag') }}</span>
        <span class="upload-hint">{{ $t('upload.hint') }}</span>
      </template>
    </div>

    <!-- 错误提示 -->
    <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

    <!-- 隐藏的 file input -->
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="sr-only"
      @change="onFileChange"
    />

    <!-- 裁剪弹窗 -->
    <Modal v-if="showCropper" @close="showCropper = false">
      <template #header>{{ $t('upload.cropImage') }}</template>
      <template #body>
        <div class="cropper-container">
          <img
            ref="cropImg"
            :src="cropSrc"
            class="crop-source"
            :style="cropStyle"
            alt="裁剪"
          />
        </div>
        <div class="crop-controls">
          <label>{{ $t('upload.zoom') }}</label>
          <input type="range" min="50" max="200" v-model.number="cropScale" />
          <span>{{ cropScale }}%</span>
        </div>
      </template>
      <template #footer>
        <button class="btn btn-primary" @click="doCrop">{{ $t('common.confirm') }}</button>
        <button class="btn" @click="showCropper = false">{{ $t('common.cancel') }}</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import request from '../api/request'
import Modal from './Modal.vue'
import { useToastStore } from '../stores/toast'

const props = defineProps({
  modelValue: { type: String, default: '' },
  accept: { type: String, default: 'image/*' },
  maxSize: { type: Number, default: 5 }, // MB
  width: { type: Number, default: 800 },
  quality: { type: Number, default: 0.85 },
  // 是否启用裁剪（仅宽高比固定的场景，如 Banner 1920x600）
  aspectRatio: { type: Number, default: 0 },
})

const emit = defineEmits(['update:modelValue'])
const toast = useToastStore()

const fileInput = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const errorMsg = ref('')

// 裁剪相关
const showCropper = ref(false)
const cropImg = ref(null)
const cropSrc = ref('')
const cropScale = ref(100)
const cropStyle = computed(() => ({
  transform: `scale(${cropScale.value / 100})`,
  transformOrigin: 'center center',
}))

function triggerInput() {
  if (uploading.value) return
  fileInput.value?.click()
}

function onDragOver() {
  isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function onFileChange(e) {
  const file = e.target?.files?.[0]
  if (file) processFile(file)
  // 重置 input 以支持重复上传同一文件
  if (fileInput.value) fileInput.value.value = ''
}

function validateFile(file) {
  errorMsg.value = ''
  if (!file.type.startsWith('image/')) {
    errorMsg.value = '请选择图片文件'
    return false
  }
  if (file.size > props.maxSize * 1024 * 1024) {
    errorMsg.value = `图片大小不能超过 ${props.maxSize}MB`
    return false
  }
  return true
}

async function processFile(file) {
  if (!validateFile(file)) return

  // 如果启用了裁剪，先进入裁剪模式
  if (props.aspectRatio > 0) {
    cropSrc.value = URL.createObjectURL(file)
    cropScale.value = 100
    showCropper.value = true
    return
  }

  await uploadFile(file)
}

function doCrop() {
  showCropper.value = false
  const canvas = document.createElement('canvas')
  const img = cropImg.value
  if (!img) return

  const targetW = props.width
  const targetH = Math.round(targetW / props.aspectRatio)

  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, targetW, targetH)

  canvas.toBlob(
    async (blob) => {
      if (blob) await uploadFile(blob, true)
      URL.revokeObjectURL(cropSrc.value)
    },
    'image/webp',
    props.quality,
  )
}

async function uploadFile(file, isCropped = false) {
  uploading.value = true
  progress.value = 0
  errorMsg.value = ''

  try {
    // 如果不启用裁剪，先压缩
    let blob = file
    if (!isCropped && file.type !== 'image/webp' && file.type !== 'image/gif') {
      blob = await compressImage(file)
    }

    const formData = new FormData()
    formData.append('file', blob, file.name || 'image.webp')

    const res = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total > 0) {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
      },
    })

    emit('update:modelValue', res.url || res.path || res)
    toast.show('上传成功', 'success')
  } catch (e) {
    const msg = typeof e === 'string' ? e : e?.message || '上传失败'
    errorMsg.value = msg
    toast.show(msg, 'error')
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > props.width) {
          height = Math.round((props.width / width) * height)
          width = props.width
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('压缩失败'))),
          'image/webp',
          props.quality,
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function removeImage() {
  emit('update:modelValue', '')
  errorMsg.value = ''
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-zone {
  border: 2px dashed var(--border, #d1d5db);
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.upload-zone:hover {
  border-color: var(--primary, #667eea);
  background: #f0f0ff;
}
.upload-zone.dragging {
  border-color: var(--primary, #667eea);
  background: #e8e8ff;
  transform: scale(1.02);
}
.upload-zone.uploading {
  cursor: default;
  border-style: solid;
}
.upload-zone.error {
  border-color: #ef4444;
}

.upload-icon {
  font-size: 36px;
}
.upload-text {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}
.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

.upload-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary, #667eea);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-area {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border, #e5e7eb);
}
.preview-img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}
.preview-actions {
  display: flex;
  gap: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.03);
  border-top: 1px solid var(--border, #e5e7eb);
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

.form-error {
  font-size: 12px;
  color: #ef4444;
  margin-top: 6px;
}

/* 裁剪 */
.cropper-container {
  max-height: 400px;
  overflow: hidden;
  text-align: center;
  background: #f3f4f6;
  border-radius: 8px;
}
.crop-source {
  max-width: 100%;
  max-height: 400px;
  transition: transform 0.15s;
}
.crop-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 13px;
}
.crop-controls input[type='range'] {
  flex: 1;
}
</style>
