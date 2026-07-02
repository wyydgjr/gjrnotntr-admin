<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div v-for="msg in messages" :key="msg.id" class="toast-item" :class="'toast-' + msg.type">
          <span class="toast-icon">{{ icons[msg.type] }}</span>
          <span class="toast-text">{{ msg.message }}</span>
          <button class="toast-close" @click="store.remove(msg.id)">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useToastStore } from '../stores/toast'

const store = useToastStore()
const messages = computed(() => store.messages)

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius);
  background: var(--bg-card);
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  min-width: 300px;
  max-width: 420px;
  pointer-events: auto;
  font-size: 14px;
}
.toast-icon {
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.toast-text {
  flex: 1;
  color: var(--text);
}
.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 2px;
  line-height: 1;
}
.toast-close:hover {
  color: var(--text);
}

.toast-success .toast-icon {
  background: #dcfce7;
  color: #166534;
}
.toast-error .toast-icon {
  background: #fee2e2;
  color: #991b1b;
}
.toast-warning .toast-icon {
  background: #fef3c7;
  color: #92400e;
}
.toast-info .toast-icon {
  background: #dbeafe;
  color: #1e40af;
}

.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
