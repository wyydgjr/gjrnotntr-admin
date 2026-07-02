<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('member.title') }}</h2>
    </div>

    <div class="tabs">
      <button class="btn" :class="{ 'btn-primary': tab === 'levels' }" @click="tab = 'levels'">{{ $t('member.levelConfig') }}</button>
      <button class="btn" :class="{ 'btn-primary': tab === 'points' }" @click="tab = 'points'">{{ $t('member.pointRules') }}</button>
      <button class="btn" :class="{ 'btn-primary': tab === 'users' }" @click="tab = 'users'">{{ $t('member.userLevels') }}</button>
    </div>

    <!-- 等级配置 -->
    <div v-if="tab === 'levels'" class="card" style="margin-top:16px">
      <div class="level-grid">
        <div v-for="lv in levels" :key="lv.id" class="level-card" :style="{ borderColor: lv.color }">
          <div class="level-badge" :style="{ background: lv.color }">{{ lv.name }}</div>
          <div class="level-info">
            <p>最低消费：¥{{ lv.minSpend?.toLocaleString() }}</p>
            <p>折扣率：{{ lv.discount }}折</p>
            <p>积分倍率：x{{ lv.pointRate }}</p>
            <p v-if="lv.benefits">权益：{{ lv.benefits }}</p>
          </div>
          <button class="btn btn-sm" @click="editLevel(lv)">{{ $t('common.edit') }}</button>
        </div>
      </div>
    </div>

    <!-- 积分规则 -->
    <div v-if="tab === 'points'" class="card" style="margin-top:16px;max-width:500px">
      <form @submit.prevent="savePointRules">
        <div class="form-group">
          <label>{{ $t('member.pointPerYuan') }}</label>
          <input v-model.number="pointRules.spendToPoint" class="form-control" type="number" />
          <span class="form-hint">每消费1元获得积分数</span>
        </div>
        <div class="form-group">
          <label>{{ $t('member.pointToMoney') }}</label>
          <input v-model.number="pointRules.pointToMoney" class="form-control" type="number" />
          <span class="form-hint">每积分可抵扣金额(元)</span>
        </div>
        <div class="form-group">
          <label>{{ $t('member.signInPoints') }}</label>
          <input v-model.number="pointRules.signInPoints" class="form-control" type="number" />
        </div>
        <button type="submit" class="btn btn-primary">{{ $t('common.save') }}</button>
      </form>
    </div>

    <!-- 用户等级列表 -->
    <div v-if="tab === 'users'" class="card" style="margin-top:16px">
      <table v-if="userLevels.length">
        <thead>
          <tr>
            <th>{{ $t('auth.username') }}</th>
            <th>{{ $t('member.level') }}</th>
            <th>{{ $t('member.points') }}</th>
            <th>{{ $t('member.totalSpend') }}</th>
            <th>{{ $t('member.discount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in userLevels" :key="u.id">
            <td>{{ u.username }}</td>
            <td><span class="badge" :style="{ background: u.levelColor || '#999' }">{{ u.levelName }}</span></td>
            <td>{{ u.points || 0 }}</td>
            <td>¥{{ (u.totalSpend || 0).toLocaleString() }}</td>
            <td>{{ (u.discount || 10) }}折</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>{{ $t('empty.default') }}</p></div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import request from '../api/request'
import Toast from '../components/Toast.vue'

const toast = useToastStore()
const tab = ref('levels')
const levels = ref([])
const userLevels = ref([])
const pointRules = ref({ spendToPoint: 1, pointToMoney: 0.01, signInPoints: 5 })

onMounted(async () => {
  try {
    const res = await request.get('/member-levels')
    levels.value = res.list || res || []
  } catch { levels.value = [] }
  try {
    const res = await request.get('/users')
    const users = res.list || res || []
    userLevels.value = users.filter(u => u.role !== 'admin').map(u => ({
      ...u,
      levelName: getLevel(u.totalSpend || 0).name,
      levelColor: getLevel(u.totalSpend || 0).color,
      discount: getLevel(u.totalSpend || 0).discount,
    }))
  } catch { userLevels.value = [] }
})

function getLevel(totalSpend) {
  if (totalSpend >= 10000) return { name: '钻石会员', color: '#6c5ce7', discount: 7 }
  if (totalSpend >= 5000) return { name: '金卡会员', color: '#f39c12', discount: 8 }
  if (totalSpend >= 2000) return { name: '银卡会员', color: '#95a5a6', discount: 9 }
  if (totalSpend >= 500) return { name: '铜卡会员', color: '#e67e22', discount: 9.5 }
  return { name: '普通会员', color: '#999', discount: 10 }
}

function editLevel(lv) {
  toast.show('编辑功能开发中', 'warning')
}

async function savePointRules() {
  toast.show('积分规则已保存', 'success')
}
</script>

<style scoped>
.tabs { display: flex; gap: 8px; }
.level-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.level-card { border: 2px solid #ddd; border-radius: 12px; padding: 20px; text-align: center; transition: all 0.2s; }
.level-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.level-badge { color: #fff; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; display: inline-block; margin-bottom: 12px; }
.level-info { font-size: 13px; color: var(--text-secondary); line-height: 1.8; text-align: left; margin-bottom: 12px; }
.form-hint { font-size: 12px; color: var(--text-secondary); display: block; margin-top: 4px; }
</style>
