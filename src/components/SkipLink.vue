<template>
  <a href="#main-content" class="skip-link">跳到主要内容</a>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  padding: 8px 16px;
  background: var(--primary, #667eea);
  color: #fff;
  border-radius: 0 0 6px 6px;
  z-index: 10000;
  font-size: 14px;
  text-decoration: none;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}
</style>
