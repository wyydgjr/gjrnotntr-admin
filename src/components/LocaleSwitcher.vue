<template>
  <div class="locale-switcher">
    <button
      class="locale-btn"
      :class="{ active: locale === 'zh' }"
      @click="switchTo('zh')"
      aria-label="切换到中文"
    >
      中
    </button>
    <button
      class="locale-btn"
      :class="{ active: locale === 'en' }"
      @click="switchTo('en')"
      aria-label="Switch to English"
    >
      EN
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function switchTo(lang) {
  locale.value = lang
  localStorage.setItem('ve_locale', lang)
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
}
</script>

<style scoped>
.locale-switcher {
  display: inline-flex;
  gap: 4px;
  background: var(--bg);
  border-radius: 8px;
  padding: 2px;
  border: 1px solid var(--border);
}
.locale-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.locale-btn:hover {
  color: var(--text);
  background: var(--bg-card);
}
.locale-btn.active {
  background: var(--primary);
  color: #fff;
}
</style>
