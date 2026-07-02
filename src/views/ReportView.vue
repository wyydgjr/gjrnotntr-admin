<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('reports.title') }}</h2>
      <div style="display:flex;gap:8px">
        <select v-model="reportType" class="form-control" style="width:140px" @change="fetchData">
          <option value="sales">{{ $t('reports.salesReport') }}</option>
          <option value="product">{{ $t('reports.productReport') }}</option>
          <option value="category">{{ $t('reports.categoryReport') }}</option>
          <option value="profit">{{ $t('reports.profitReport') }}</option>
        </select>
        <input v-model="dateFrom" class="form-control" type="date" style="width:150px" @change="fetchData" />
        <span style="line-height:34px">~</span>
        <input v-model="dateTo" class="form-control" type="date" style="width:150px" @change="fetchData" />
        <button class="btn btn-primary" @click="doExport" v-if="permission.can('reports','export')">{{ $t('common.export') }}</button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <div class="summary-item">
        <span class="summary-label">{{ $t('reports.totalOrders') }}</span>
        <span class="summary-num">{{ summary.totalOrders }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ $t('reports.totalRevenue') }}</span>
        <span class="summary-num primary">¥{{ summary.totalRevenue.toLocaleString() }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ $t('reports.totalCost') }}</span>
        <span class="summary-num">¥{{ summary.totalCost.toLocaleString() }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ $t('reports.totalProfit') }}</span>
        <span class="summary-num" :class="summary.totalProfit >= 0 ? 'success' : 'danger'">¥{{ summary.totalProfit.toLocaleString() }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ $t('reports.profitMargin') }}</span>
        <span class="summary-num">{{ summary.profitMargin }}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">{{ $t('reports.avgOrderValue') }}</span>
        <span class="summary-num">¥{{ summary.avgOrderValue.toLocaleString() }}</span>
      </div>
    </div>

    <!-- 图表 -->
    <div class="card" style="margin-top:16px">
      <div ref="chartRef" style="height:380px"></div>
    </div>

    <!-- 数据表格 -->
    <div class="card" style="margin-top:16px">
      <table v-if="tableData.length">
        <thead>
          <tr>
            <th v-for="col in tableColumns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td v-for="col in tableColumns" :key="col">{{ row[col] || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>{{ $t('empty.default') }}</p></div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePermissionStore } from '../stores/permission'
import { useToastStore } from '../stores/toast'
import request from '../api/request'
import * as echarts from 'echarts'
import { exportExcel } from '../utils/export'
import Toast from '../components/Toast.vue'

const permission = usePermissionStore()
const toast = useToastStore()
const reportType = ref('sales')
const dateFrom = ref(getDefaultFrom())
const dateTo = ref(getDefaultTo())
const chartRef = ref(null)
const tableData = ref([])
let chartInstance = null

const summary = ref({
  totalOrders: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0,
  profitMargin: 0, avgOrderValue: 0,
})

const tableColumns = computed(() => {
  const map = {
    sales: ['日期', '订单数', '营收', '成本', '利润'],
    product: ['商品名称', '销量', '营收', '成本', '利润'],
    category: ['分类', '销量', '营收', '成本', '利润'],
    profit: ['日期', '营收', '成本', '利润', '利润率'],
  }
  return map[reportType.value] || map.sales
})

function getDefaultFrom() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}
function getDefaultTo() {
  return new Date().toISOString().slice(0, 10)
}

async function fetchData() {
  try {
    const params = { type: reportType.value, from: dateFrom.value, to: dateTo.value }
    const res = await request.get('/reports', { params })
    summary.value = res.summary || summary.value
    tableData.value = res.data || []
    await nextTick()
    renderChart(res.chartData || {})
  } catch {
    toast.show('加载报表失败', 'error')
  }
}

function renderChart(data) {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['营收', '成本', '利润'], bottom: 0 },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: data.labels || [] },
    yAxis: { type: 'value' },
    series: [
      { name: '营收', type: 'bar', data: data.revenue || [], itemStyle: { color: '#4e79a7' } },
      { name: '成本', type: 'bar', data: data.cost || [], itemStyle: { color: '#f28e2b' } },
      { name: '利润', type: 'line', data: data.profit || [], itemStyle: { color: '#59a14f' }, smooth: true },
    ],
  }
  chartInstance.setOption(option, true)
}

function doExport() {
  exportExcel(`报表_${reportType.value}_${dateFrom.value}_${dateTo.value}`, tableColumns.value, tableData.value)
}

watch(reportType, fetchData)
onMounted(fetchData)
</script>

<style scoped>
.summary-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.summary-item { text-align: center; padding: 16px 12px; border-radius: 8px; background: var(--bg-card); border: 1px solid var(--border); }
.summary-label { font-size: 12px; color: var(--text-secondary); display: block; }
.summary-num { font-size: 22px; font-weight: 700; display: block; margin-top: 6px; }
.summary-num.primary { color: var(--primary); }
.summary-num.success { color: #22c55e; }
.summary-num.danger { color: var(--danger); }
@media (max-width: 768px) { .summary-cards { grid-template-columns: repeat(3, 1fr); } }
</style>
