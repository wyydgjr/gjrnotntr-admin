<template>
  <div v-if="totalPages > 1" class="pagination">
    <span class="pagination-info">共 {{ total }} 条</span>
    <div class="pagination-btns">
      <button class="page-btn" :disabled="modelValue <= 1" @click="go(modelValue - 1)">‹</button>
      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="page-ellipsis">…</span>
        <button v-else class="page-btn" :class="{ active: p === modelValue }" @click="go(p)">
          {{ p }}
        </button>
      </template>
      <button class="page-btn" :disabled="modelValue >= totalPages" @click="go(modelValue + 1)">
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  modelValue: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
})

const emit = defineEmits(['update:modelValue', 'change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = props.modelValue
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

function go(page) {
  if (page < 1 || page > totalPages.value || page === props.modelValue) return
  emit('update:modelValue', page)
  emit('change', page)
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 4px;
}
.pagination-info {
  font-size: 13px;
  color: var(--text-secondary);
}
.pagination-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
.page-btn {
  min-width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  padding: 0 8px;
}
.page-btn:hover:not(:disabled):not(.active) {
  border-color: var(--primary);
  color: var(--primary);
}
.page-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-ellipsis {
  padding: 0 6px;
  color: var(--text-secondary);
}
</style>
