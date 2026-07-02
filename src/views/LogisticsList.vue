<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('logistics.title') }}</h2>
      <div style="display:flex;gap:8px">
        <select v-model="statusFilter" class="form-control" style="width:140px" @change="fetchData">
          <option value="">{{ $t('order.status') }}</option>
          <option value="shipped">{{ $t('order.shipped') }}</option>
          <option value="completed">{{ $t('order.completed') }}</option>
        </select>
        <input v-model="keyword" class="form-control" :placeholder="$t('common.search') + '...'" style="width:200px" @keyup.enter="fetchData" />
        <button class="btn" @click="fetchData">{{ $t('common.search') }}</button>
      </div>
    </div>

    <div class="card">
      <table v-if="list.length">
        <thead>
          <tr>
            <th>{{ $t('order.orderId') }}</th>
            <th>{{ $t('auth.username') }}</th>
            <th>{{ $t('logistics.company') }}</th>
            <th>{{ $t('logistics.trackingNo') }}</th>
            <th>{{ $t('logistics.shipTime') }}</th>
            <th>{{ $t('order.status') }}</th>
            <th>{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in list" :key="o.id">
            <td>#{{ o.id }}</td>
            <td>{{ o.userName }}</td>
            <td>{{ o.tracking?.company || '-' }}</td>
            <td>
              <span v-if="o.tracking?.number" class="tracking-link" @click="trackOrder(o)">{{ o.tracking.number }}</span>
              <span v-else>-</span>
            </td>
            <td>{{ o.shippedAt || '-' }}</td>
            <td><span class="badge" :class="statusClass(o.status)">{{ statusText(o.status) }}</span></td>
            <td>
              <button v-if="o.status === 'pending'" class="btn btn-sm btn-primary" @click="openShip(o)">{{ $t('logistics.ship') }}</button>
              <button v-if="o.status === 'shipped'" class="btn btn-sm" @click="markComplete(o)">{{ $t('logistics.markCompleted') }}</button>
              <button v-if="o.tracking?.number" class="btn btn-sm" style="margin-left:4px" @click="printWaybill(o)">{{ $t('logistics.printWaybill') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>{{ $t('empty.default') }}</p></div>
    </div>

    <!-- 发货弹窗 -->
    <Modal v-if="shipVisible" :title="$t('logistics.ship')" @close="shipVisible = false">
      <form @submit.prevent="doShip">
        <div class="form-group">
          <label>{{ $t('logistics.company') }}</label>
          <select v-model="shipForm.company" class="form-control" required>
            <option value="">-- 选择快递 --</option>
            <option v-for="c in expressCompanies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('logistics.trackingNo') }}</label>
          <input v-model="shipForm.number" class="form-control" required :placeholder="$t('logistics.trackingNo')" />
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button type="submit" class="btn btn-primary">{{ $t('common.confirm') }}</button>
          <button type="button" class="btn" @click="shipVisible = false">{{ $t('common.cancel') }}</button>
        </div>
      </form>
    </Modal>

    <!-- 打印运单 -->
    <Modal v-if="printVisible" :title="$t('logistics.printWaybill')" @close="printVisible = false" width="500">
      <div ref="waybillRef" class="waybill">
        <div class="waybill-header">
          <h3>{{ shipForm.company }}</h3>
          <p>运单号：{{ shipForm.number }}</p>
        </div>
        <div class="waybill-body">
          <div class="waybill-row"><span>发件人：</span><span>VeStore 官方商城</span></div>
          <div class="waybill-row"><span>收件人：</span><span>{{ printOrder?.name || printOrder?.userName }}</span></div>
          <div class="waybill-row"><span>电话：</span><span>{{ printOrder?.phone || '-' }}</span></div>
          <div class="waybill-row"><span>地址：</span><span>{{ printOrder?.address || '-' }}</span></div>
          <div class="waybill-row"><span>商品：</span><span>{{ (printOrder?.items || []).map(i => `${i.name} x${i.qty}`).join('、') }}</span></div>
          <div class="waybill-row"><span>订单号：</span><span>#{{ printOrder?.id }}</span></div>
        </div>
        <div class="waybill-footer">
          <p>{{ new Date().toLocaleDateString() }}</p>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button class="btn btn-primary" @click="doPrint">{{ $t('common.confirm') }}</button>
        <button class="btn" @click="printVisible = false">{{ $t('common.cancel') }}</button>
      </div>
    </Modal>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../stores/toast'
import request from '../api/request'
import Modal from '../components/Modal.vue'
import Toast from '../components/Toast.vue'

const toast = useToastStore()
const list = ref([])
const keyword = ref('')
const statusFilter = ref('')
const shipVisible = ref(false)
const shipOrder = ref(null)
const shipForm = ref({ company: '', number: '' })
const printVisible = ref(false)
const printOrder = ref(null)
const waybillRef = ref(null)

const expressCompanies = ['顺丰速运', '圆通速递', '中通快递', '韵达快递', '申通快递', '极兔速递', '京东物流', '德邦快递', 'EMS']

const statusMap = { pending: '待处理', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
function statusText(s) { return statusMap[s] || s }
function statusClass(s) {
  if (s === 'pending') return 'badge-pending'
  if (s === 'shipped') return 'badge-shipped'
  if (s === 'completed') return 'badge-completed'
  if (s === 'cancelled') return 'badge-cancelled'
  return ''
}

async function fetchData() {
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (keyword.value) params.keyword = keyword.value
    const res = await request.get('/orders', { params })
    list.value = (res.list || res).filter(o => ['shipped', 'completed', 'pending'].includes(o.status))
  } catch { toast.show('加载失败', 'error') }
}

function openShip(o) {
  shipOrder.value = o
  shipForm.value = { company: expressCompanies[0], number: '' }
  shipVisible.value = true
}

async function doShip() {
  if (!shipForm.value.company || !shipForm.value.number) {
    toast.show('请填写完整信息', 'warning')
    return
  }
  try {
    const o = shipOrder.value
    await request.put(`/orders/${o.id}`, {
      ...o,
      status: 'shipped',
      tracking: shipForm.value,
      shippedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    })
    toast.show('已发货', 'success')
    shipVisible.value = false
    fetchData()
  } catch { toast.show('操作失败', 'error') }
}

async function markComplete(o) {
  if (!confirm('确认标记为已完成？')) return
  try {
    await request.put(`/orders/${o.id}`, { ...o, status: 'completed' })
    toast.show('已完成', 'success')
    fetchData()
  } catch { toast.show('操作失败', 'error') }
}

function trackOrder(o) {
  window.open(`https://www.kuaidi100.com/chaxun?com=${encodeURIComponent(o.tracking?.company || '')}&nu=${o.tracking?.number}`, '_blank')
}

function printWaybill(o) {
  printOrder.value = o
  shipForm.value = o.tracking || { company: '', number: '' }
  printVisible.value = true
}

function doPrint() {
  const content = waybillRef.value?.innerHTML
  if (!content) return
  const win = window.open('', '_blank', 'width=600,height=500')
  win.document.write(`<html><head><title>运单</title><style>
    body{font-family:sans-serif;padding:20px}
    .waybill{border:2px solid #000;padding:20px;max-width:400px;margin:0 auto}
    .waybill-header{text-align:center;border-bottom:1px solid #000;padding-bottom:12px;margin-bottom:12px}
    .waybill-header h3{margin:0 0 4px}
    .waybill-row{display:flex;padding:6px 0;font-size:14px}
    .waybill-row span:first-child{min-width:60px;font-weight:600}
    .waybill-footer{text-align:center;margin-top:16px;border-top:1px solid #000;padding-top:12px}
    @media print{body{margin:0;padding:0}}
  </style></head><body>${content}</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 500)
}

onMounted(fetchData)
</script>

<style scoped>
.tracking-link { color: var(--primary); cursor: pointer; font-weight: 500; text-decoration: underline; }
.waybill { border: 2px solid #000; padding: 20px; }
.waybill-header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
.waybill-header h3 { margin: 0 0 4px; }
.waybill-row { display: flex; padding: 6px 0; font-size: 14px; }
.waybill-row span:first-child { min-width: 60px; font-weight: 600; }
.waybill-footer { text-align: center; margin-top: 16px; border-top: 1px solid #000; padding-top: 12px; }
</style>
