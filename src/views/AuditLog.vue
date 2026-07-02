<template>
  <div>
    <div class="page-header"><h2>操作日志</h2></div>
    <div v-if="loading" style="text-align: center; padding: 40px">加载中...</div>
    <div v-else class="log-list">
      <div v-for="log in list" :key="log.id" class="log-item">
        <span class="log-action">{{ log.action }}</span>
        <span class="log-detail">{{ log.detail }}</span>
        <span class="log-admin">{{ log.admin }}</span>
        <span class="log-time">{{ log.createdAt }}</span>
      </div>
      <div v-if="!list.length" class="empty-state"><p>暂无日志</p></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import request from '../api/request'
const list = ref([])
const loading = ref(true)
onMounted(async () => {
  try {
    const r = await request.get('/audit-logs')
    list.value = r.list || r || []
  } catch {}
  loading.value = false
})
</script>
<style scoped>
.log-list {
  display: flex;
  flex-direction: column;
}
.log-item {
  display: flex;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  align-items: center;
}
.log-action {
  background: var(--bg);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  min-width: 60px;
}
.log-detail {
  flex: 1;
  color: var(--text);
}
.log-admin {
  color: var(--text-secondary);
  min-width: 80px;
}
.log-time {
  color: var(--text-secondary);
  font-size: 12px;
  min-width: 140px;
}
</style>
