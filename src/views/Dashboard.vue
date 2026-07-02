<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('nav.dashboard') }}</h2>
      <button class="btn" @click="doWordReport">📄 导出Word报告</button>
    </div>

    <div class="stats-grid">
      <div
        class="stat-card"
        v-for="s in stats"
        :key="s.label"
        @click="s.route && $router.push(s.route)"
        :style="{ cursor: s.route ? 'pointer' : 'default' }"
      >
        <div class="stat-icon" :style="{ background: s.bg }">{{ s.icon }}</div>
        <div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-charts">
      <div class="card">
        <h3 class="chart-title">月度营收趋势</h3>
        <v-chart v-if="chartOption" :option="chartOption" class="echart-box" autoresize />
        <div v-else class="empty-chart">暂无营收数据</div>
      </div>

      <div class="card">
        <h3 class="chart-title">最近活动</h3>
        <div v-if="activities.length" class="activity-list">
          <div v-for="(act, i) in activities" :key="i" class="activity-item">
            <div
              class="activity-dot"
              :class="{
                'dot-user': act.type === '新增用户',
                'dot-order': act.type === '新订单',
                'dot-product': act.type !== '新增用户' && act.type !== '新订单',
              }"
            ></div>
            <div class="activity-content">
              <span
                class="badge"
                :class="{
                  'badge-active': act.type === '新增用户',
                  'badge-pending': act.type === '新订单',
                  'badge-inactive': act.type !== '新增用户' && act.type !== '新订单',
                }"
                >{{ act.type }}</span
              >
              <span class="activity-text">{{ act.content }}</span>
            </div>
            <span class="activity-time">{{ act.time }}</span>
          </div>
        </div>
        <div v-else class="empty-chart">暂无活动</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getDashboardStats, getDashboardActivities, getDashboardRevenue } from '../api/dashboard'
import { exportWord } from '../utils/export'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const $router = useRouter()

const stats = ref([
  { label: '用户总数', value: 0, icon: '👥', bg: '#ede9fe', route: '/admin/users' },
  { label: '产品总数', value: 0, icon: '📦', bg: '#dbeafe', route: '/admin/products' },
  { label: '订单总数', value: 0, icon: '📋', bg: '#dcfce7', route: '/admin/orders' },
  { label: '活跃用户', value: 0, icon: '⭐', bg: '#fef3c7' },
  { label: '待处理订单', value: 0, icon: '⏳', bg: '#fed7aa', route: '/admin/orders' },
  { label: '低库存商品', value: 0, icon: '⚠️', bg: '#fee2e2', route: '/admin/products' },
])

const activities = ref([])
const revenue = ref({ months: [], values: [] })

const chartOption = computed(() => {
  const { months, values } = revenue.value
  if (!months || !months.length) return null
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `${p.axisValue}<br/>营收：<b>¥${p.value.toLocaleString()}</b>`
      },
    },
    grid: { top: 10, right: 10, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: months.map((m) => m.slice(5) + '月'),
      axisLabel: { fontSize: 12, color: '#999' },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#999',
        formatter: (v) => '¥' + (v / 1000).toFixed(0) + 'k',
      },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#818cf8' },
            ],
          },
        },
        emphasis: {
          itemStyle: { color: '#667eea' },
        },
      },
    ],
  }
})

const trendText = computed(() => {
  const v = revenue.value.values
  if (v.length < 2) return '数据不足'
  const prev = v[v.length - 2] || 0
  const curr = v[v.length - 1] || 0
  if (prev === 0) return curr > 0 ? '+∞' : '0%'
  const pct = (((curr - prev) / prev) * 100).toFixed(1)
  return (pct >= 0 ? '+' : '') + pct + '%'
})

function doWordReport() {
  const s = stats.value.reduce((acc, cur) => {
    acc[cur.label] = cur.value
    return acc
  }, {})
  exportWord('VeStore 数据报告', [
    {
      heading: '核心数据概览',
      fields: [
        { label: '用户总数', value: s['用户总数'] || 0 },
        { label: '产品总数', value: s['产品总数'] || 0 },
        { label: '订单总数', value: s['订单总数'] || 0 },
        { label: '活跃用户', value: s['活跃用户'] || 0 },
        { label: '待处理订单', value: s['待处理订单'] || 0 },
        { label: '低库存商品', value: s['低库存商品'] || 0 },
      ],
    },
    {
      heading: '月度营收',
      headers: ['月份', '营收'],
      rows: revenue.value.months.map((m, i) => [
        m,
        `¥${(revenue.value.values[i] || 0).toLocaleString()}`,
      ]),
    },
  ])
}

onMounted(async () => {
  try {
    const [s, act, rev] = await Promise.all([
      getDashboardStats(),
      getDashboardActivities(),
      getDashboardRevenue(),
    ])
    if (s) {
      stats.value[0].value = s.userCount || 0
      stats.value[1].value = s.productCount || 0
      stats.value[2].value = s.orderCount || 0
      stats.value[3].value = s.activeUsers || 0
      stats.value[4].value = s.pendingOrders || 0
      stats.value[5].value = s.lowStock || 0
    }
    if (Array.isArray(act)) activities.value = act
    if (rev) revenue.value = rev
  } catch {}
})
</script>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
}

.dashboard-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 24px;
}
@media (max-width: 768px) {
  .dashboard-charts {
    grid-template-columns: 1fr;
  }
}

.echart-box {
  width: 100%;
  height: 280px;
}

.empty-chart {
  padding: 32px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
}
.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.dot-user {
  background: var(--success);
}
.dot-order {
  background: var(--warning);
}
.dot-product {
  background: var(--info);
}
.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.activity-text {
  color: var(--text);
}
.activity-time {
  color: var(--text-secondary);
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
