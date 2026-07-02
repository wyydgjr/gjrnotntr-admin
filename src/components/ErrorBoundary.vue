<template>
  <div class="error-boundary">
    <div v-if="error" class="error-fallback" role="alert">
      <div class="error-icon">⚠️</div>
      <h3>{{ $t('errorBoundary.title') }}</h3>
      <p v-if="showDetails" class="error-message">{{ error.message || error }}</p>
      <div class="error-actions">
        <button class="btn btn-primary" @click="retry">{{ $t('errorBoundary.retry') }}</button>
        <button v-if="!showDetails" class="btn" @click="showDetails = true">
          {{ $t('common.details') }}
        </button>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)
const showDetails = ref(false)

onErrorCaptured((err, instance, info) => {
  error.value = err
  console.error('[ErrorBoundary]', err, { instance, info })
  return false // 阻止错误继续传播
})

function retry() {
  error.value = null
  showDetails.value = false
}
</script>

<style scoped>
.error-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  min-height: 300px;
}
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.error-fallback h3 {
  font-size: 20px;
  color: var(--text);
  margin-bottom: 8px;
}
.error-message {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 500px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  word-break: break-word;
}
.error-actions {
  display: flex;
  gap: 12px;
}
</style>
