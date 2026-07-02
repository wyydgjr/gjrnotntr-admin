<template>
  <div class="skeleton-loader" :class="variant" aria-busy="true" aria-label="加载中">
    <template v-if="variant === 'card'">
      <div class="sk-block sk-img"></div>
      <div class="sk-block sk-title"></div>
      <div class="sk-block sk-text"></div>
      <div class="sk-block sk-text short"></div>
    </template>
    <template v-else-if="variant === 'table-row'">
      <div class="sk-block sk-cell" v-for="i in columns" :key="i"></div>
    </template>
    <template v-else-if="variant === 'list'">
      <div class="sk-block sk-title"></div>
      <div class="sk-block sk-text"></div>
      <div class="sk-block sk-text short"></div>
    </template>
    <template v-else>
      <!-- text / default -->
      <div
        class="sk-block sk-text"
        v-for="i in lines"
        :key="i"
        :style="{ width: randomWidth() }"
      ></div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'text' },
  lines: { type: Number, default: 4 },
  columns: { type: Number, default: 4 },
})

function randomWidth() {
  return `${60 + Math.random() * 35}%`
}
</script>

<style scoped>
.skeleton-loader {
  padding: 16px;
}
.sk-block {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  margin-bottom: 10px;
}
.sk-img {
  width: 100%;
  height: 180px;
}
.sk-title {
  width: 70%;
  height: 20px;
}
.sk-text {
  width: 100%;
  height: 14px;
}
.sk-text.short {
  width: 45%;
}
.sk-cell {
  display: inline-block;
  width: calc(25% - 8px);
  height: 16px;
  margin-right: 8px;
}

.card {
  padding: 12px;
}
.table-row {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
