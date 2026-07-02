<template>
  <div class="empty-state" role="status">
    <div class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title || $t('common.noData') }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <slot>
      <button v-if="actionText" class="btn btn-primary" @click="$emit('action')">
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  actionText: { type: String, default: '' },
})
defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}
.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.6;
}
.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
}
.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 400px;
  margin-bottom: 24px;
}
</style>
