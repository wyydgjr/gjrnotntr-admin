<template>
  <div>
    <div class="page-header"><h2>评价管理</h2></div>

    <DataTable :columns="columns" :items="reviews" :loading="loading" empty-text="暂无评价">
      <template #actions="{ row }">
        <button class="btn btn-sm btn-danger" @click="delReview(row)">删除</button>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import request from '../api/request'

const toast = useToastStore()
const reviews = ref([])
const loading = ref(true)

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: '用户' },
  { key: 'productId', label: '商品ID' },
  { key: 'rating', label: '评分', render: (r) => '★'.repeat(r.rating || 5) },
  { key: 'content', label: '内容' },
  { key: 'createdAt', label: '时间' },
]

onMounted(load)

async function load() {
  loading.value = true
  try {
    const res = await request.get('/reviews?page=1&pageSize=200')
    reviews.value = res.list || res || []
  } catch {}
  loading.value = false
}

async function delReview(row) {
  if (!confirm(`删除评价 #${row.id}？`)) return
  try {
    await request.delete(`/reviews/${row.id}`)
    reviews.value = reviews.value.filter((r) => r.id !== row.id)
    toast.show('已删除', 'success')
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
