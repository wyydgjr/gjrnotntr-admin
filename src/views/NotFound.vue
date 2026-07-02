<template>
  <div class="not-found">
    <div class="not-found-card">
      <div class="nf-icon">404</div>
      <h1>页面不存在</h1>
      <p>您访问的页面不存在或已被移除</p>
      <div class="nf-actions">
        <router-link to="/" class="btn btn-primary">返回首页</router-link>
        <router-link to="/products" class="btn">去逛逛</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 40px 24px;
}
.not-found-card {
  text-align: center;
}
.nf-icon {
  font-size: 80px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 16px;
}
.not-found-card h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}
.not-found-card p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}
.nf-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
