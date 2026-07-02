<template>
  <div class="card">
    <div v-if="loading" class="empty-state">
      <p>加载中...</p>
    </div>
    <template v-else-if="items.length === 0">
      <div class="empty-state">
        <p>{{ emptyText || '暂无数据' }}</p>
      </div>
    </template>
    <table v-else>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">
            {{ col.label }}
          </th>
          <th v-if="$slots.actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in items" :key="row.id || i">
          <td v-for="col in columns" :key="col.key">
            <!-- 安全渲染：优先使用 text 函数（纯文本），其次 render 函数需自行消毒 -->
            <template v-if="col.render">
              <span
                v-if="col.badge || col.htmlClass"
                :class="typeof col.htmlClass === 'function' ? col.htmlClass(row) : col.htmlClass"
                v-text="col.render(row)"
              />
              <span v-else v-text="col.render(row)" />
            </template>
            <template v-else>{{ row[col.key] ?? '-' }}</template>
          </td>
          <td v-if="$slots.actions" class="actions-cell">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
})
</script>

<style scoped>
.card {
  padding: 0;
  overflow-x: auto;
}
table {
  min-width: 600px;
}
.actions-cell {
  white-space: nowrap;
}
.actions-cell :deep(.btn) {
  margin-right: 6px;
}
.actions-cell :deep(.btn:last-child) {
  margin-right: 0;
}
</style>
