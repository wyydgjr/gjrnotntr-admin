<template>
  <div>
    <div class="page-header">
      <h2>分类管理</h2>
      <router-link to="/admin/categories/new" class="btn btn-primary">新增分类</router-link>
    </div>

    <div style="margin-bottom: 16px">
      <SearchBar placeholder="搜索分类名称..." @search="handleSearch" />
    </div>

    <DataTable
      :columns="columns"
      :items="store.list"
      :loading="store.loading"
      empty-text="暂无分类数据"
    >
      <template #actions="{ row }">
        <router-link :to="`/admin/categories/${row.id}/edit`" class="btn btn-sm">编辑</router-link>
        <button class="btn btn-sm btn-danger" @click="handleDelete(row)">删除</button>
      </template>
    </DataTable>

    <Pagination
      v-if="store.total > pageSize"
      :total="store.total"
      v-model="page"
      :page-size="pageSize"
      @change="loadData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'

const store = useResourceStore('categories', '/categories')
const toast = useToastStore()
const page = ref(1)
const pageSize = 20

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '分类名称' },
  { key: 'description', label: '描述' },
  { key: 'productCount', label: '产品数量' },
  { key: 'createdAt', label: '创建时间' },
]

onMounted(() => store.fetchList())

watch(page, () => loadData())

function loadData() {
  store.fetchList({ page: page.value, pageSize })
}

function handleSearch(keyword) {
  page.value = 1
  store.fetchList({ keyword, page: 1, pageSize })
}

async function handleDelete(row) {
  if (!confirm(`确认删除分类「${row.name}」？`)) return
  try {
    await store.remove(row.id)
    toast.show('分类已删除', 'success')
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
