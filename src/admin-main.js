import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/admin-router'
import i18n from './i18n'
import { useAuthStore } from './stores/auth'
import lazyLoad from './directives/lazy-load'
import { setupGlobalErrorHandler, trackPageLoad } from './utils/monitoring'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

app.directive('lazy', lazyLoad)

app.config.errorHandler = (err, instance, info) => {
  console.error('[VeStore Admin Error]', err, { instance, info })
  if (import.meta.env.PROD) {
    // TODO: Sentry.captureException(err, { extra: { info } })
  }
}

setupGlobalErrorHandler()
trackPageLoad()

const auth = useAuthStore()
auth.initFromStorage()

app.mount('#app')
