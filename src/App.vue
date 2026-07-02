<template>
  <ErrorBoundary>
    <SkipLink />
    <div v-if="loading" class="route-loading-bar" role="progressbar" aria-label="页面加载中"></div>
    <!-- 离线提示 -->
    <div v-if="offline" class="offline-banner" role="alert">⚠️ {{ $t('common.offline') }}</div>
    <router-view v-slot="{ Component, route }">
      <Transition :name="route.meta.transition || 'fade'" mode="out-in">
        <template v-if="Component">
          <Suspense>
            <component :is="Component" :key="route.path" />
            <template #fallback>
              <div class="page-loading" role="status" aria-live="polite">
                <div class="spinner"></div>
                <p>{{ $t('common.loading') }}</p>
              </div>
            </template>
          </Suspense>
        </template>
      </Transition>
    </router-view>
  </ErrorBoundary>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SkipLink from './components/SkipLink.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

const $router = useRouter()
const loading = ref(false)
const offline = ref(false)
let timer = null

$router.beforeEach((_to, from) => {
  // 显式返回 true 放行导航（Vue Router 4 推荐）
  if (_to.path !== from.path) {
    clearTimeout(timer)
    loading.value = true
  }
  return true
})

$router.afterEach(() => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    loading.value = false
  }, 300)
})

onMounted(() => {
  if (typeof window !== 'undefined') {
    offline.value = !navigator.onLine
    window.addEventListener('online', () => {
      offline.value = false
    })
    window.addEventListener('offline', () => {
      offline.value = true
    })
  }
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<style>
/* ── 路由过渡动画 ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.route-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  z-index: 9999;
  animation: loadingSlide 1s ease infinite;
}
@keyframes loadingSlide {
  0% {
    width: 0;
  }
  50% {
    width: 60%;
  }
  100% {
    width: 100%;
  }
}

.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background: #f59e0b;
  color: #fff;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  font-weight: 500;
}

.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: var(--text-secondary);
  gap: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
