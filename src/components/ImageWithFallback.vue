<template>
  <img
    v-if="loadedSrc"
    :src="loadedSrc"
    :alt="alt"
    class="image-fallback"
    :class="imgClass"
    @error="onError"
  />
  <div v-else-if="placeholder" class="image-placeholder" :class="imgClass">
    <span>{{ placeholder }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  fallback: { type: String, default: '' },
  placeholder: { type: String, default: '🖼️' },
  imgClass: { type: String, default: '' },
})

const loadedSrc = ref(props.src)
const retries = ref(0)
const MAX_RETRIES = 2

watch(
  () => props.src,
  (val) => {
    loadedSrc.value = val
    retries.value = 0
  },
)

function onError() {
  retries.value++
  if (retries.value <= MAX_RETRIES && loadedSrc.value) {
    // 重试一次
    const current = loadedSrc.value
    loadedSrc.value = ''
    setTimeout(() => {
      loadedSrc.value = current
    }, 300)
  } else if (props.fallback) {
    loadedSrc.value = props.fallback
  } else {
    loadedSrc.value = ''
  }
}
</script>

<style scoped>
.image-fallback {
  display: block;
  max-width: 100%;
  height: auto;
}
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 32px;
  min-height: 120px;
}
</style>
