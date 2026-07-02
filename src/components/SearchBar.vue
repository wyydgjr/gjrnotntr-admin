<template>
  <div class="search-bar">
    <input
      v-model="keyword"
      class="form-control"
      :placeholder="placeholder || '搜索...'"
      @keyup.enter="doSearch"
      @input="onInput"
    />
    <button class="btn btn-primary" @click="doSearch">搜索</button>
    <button v-if="showReset && keyword" class="btn" @click="reset">重置</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  placeholder: String,
  showReset: { type: Boolean, default: true },
})
const emit = defineEmits(['search'])

const keyword = ref('')
let debounceTimer = null

function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', keyword.value)
  }, 400)
}

function doSearch() {
  clearTimeout(debounceTimer)
  emit('search', keyword.value)
}

function reset() {
  clearTimeout(debounceTimer)
  keyword.value = ''
  emit('search', '')
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.search-bar .form-control {
  width: 260px;
}
</style>
