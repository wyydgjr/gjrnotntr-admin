<template>
  <div v-if="order">
    <div class="page-header">
      <h2>订单详情 #{{ order.id }}</h2>
      <router-link to="/orders" class="btn">← 返回列表</router-link>
      <button class="btn" @click="doWordExport">📄 导出Word</button>
    </div>

    <div class="detail-grid">
      <div class="card">
        <h3 class="section-title">订单信息</h3>
        <div class="info-row">
          <span class="info-label">订单号</span><span>{{ order.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="badge" :class="statusClass">{{ statusText }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">创建时间</span><span>{{ order.createdAt }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">总金额</span
          ><span class="total-amount">¥{{ order.total.toLocaleString() }}</span>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">用户信息</h3>
        <div class="info-row">
          <span class="info-label">用户名</span><span>{{ order.userName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">用户ID</span><span>{{ order.userId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">收件人</span><span>{{ order.name || order.userName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">手机号</span><span>{{ order.phone || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">地址</span><span>{{ order.address }}</span>
        </div>
      </div>
      <div v-if="order.status === 'shipped' || order.status === 'completed'" class="card">
        <h3 class="section-title">物流信息</h3>
        <div class="info-row">
          <span class="info-label">快递公司</span><span>{{ order.tracking?.company || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">快递单号</span
          ><span class="tracking-num">{{ order.tracking?.number || '—' }}</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px">
      <h3 class="section-title">商品明细</h3>
      <table>
        <thead>
          <tr>
            <th>商品名称</th>
            <th>单价</th>
            <th>数量</th>
            <th>小计</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in order.items" :key="i">
            <td>{{ item.name }}</td>
            <td>¥{{ item.price }}</td>
            <td>{{ item.qty }}</td>
            <td>¥{{ (item.price * item.qty).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="order.status === 'pending'"
      style="margin-top: 20px; display: flex; flex-direction: column; gap: 12px"
    >
      <div class="card" style="padding: 16px">
        <h3 class="section-title">发货信息</h3>
        <div style="display: flex; gap: 10px">
          <input
            v-model="trackingCompany"
            class="form-control"
            placeholder="快递公司"
            style="width: 160px"
          />
          <input v-model="trackingNumber" class="form-control" placeholder="快递单号" />
          <button class="btn btn-primary" @click="shipOrder">确认发货</button>
          <button class="btn btn-danger" @click="updateStatus('cancelled')">取消订单</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty-state"><p>加载中...</p></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import { exportWord } from '../utils/export'

const route = useRoute()
const router = useRouter()
const store = useResourceStore('order-detail', '/orders')
const toast = useToastStore()

const order = ref(null)
const trackingCompany = ref('')
const trackingNumber = ref('')

const statusMap = { pending: '待处理', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const statusText = computed(() => statusMap[order.value?.status] || order.value?.status)
const statusClass = computed(() => {
  const s = order.value?.status
  if (s === 'pending') return 'badge-pending'
  if (s === 'shipped') return 'badge-shipped'
  if (s === 'completed') return 'badge-completed'
  if (s === 'cancelled') return 'badge-cancelled'
  return 'badge-inactive'
})

onMounted(async () => {
  try {
    await store.fetchById(route.params.id)
    if (store.current) {
      order.value = store.current
    } else {
      toast.show('订单不存在', 'error')
      router.push('/orders')
    }
  } catch {
    toast.show('加载订单失败', 'error')
    router.push('/orders')
  }
})

async function shipOrder() {
  if (!trackingCompany.value || !trackingNumber.value) {
    toast.show('请填写快递公司和单号', 'warning')
    return
  }
  try {
    await store.save({
      ...order.value,
      status: 'shipped',
      tracking: { company: trackingCompany.value, number: trackingNumber.value },
    })
    order.value.status = 'shipped'
    order.value.tracking = { company: trackingCompany.value, number: trackingNumber.value }
    toast.show('已发货', 'success')
  } catch {
    toast.show('操作失败', 'error')
  }
}

function doWordExport() {
  if (!order.value) return
  const o = order.value
  const statusMap = {
    pending: '待处理',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  }
  exportWord(`订单 #${o.id}`, [
    {
      heading: '订单信息',
      fields: [
        { label: '订单号', value: o.id },
        { label: '状态', value: statusMap[o.status] || o.status },
        { label: '创建时间', value: o.createdAt },
        { label: '总金额', value: `¥${o.total.toLocaleString()}` },
      ],
    },
    {
      heading: '用户信息',
      fields: [
        { label: '用户名', value: o.userName },
        { label: '收件人', value: o.name || o.userName },
        { label: '手机号', value: o.phone || '—' },
        { label: '地址', value: o.address },
      ],
    },
    ...(o.tracking
      ? [
          {
            heading: '物流信息',
            fields: [
              { label: '快递公司', value: o.tracking.company || '—' },
              { label: '快递单号', value: o.tracking.number || '—' },
            ],
          },
        ]
      : []),
    {
      heading: '商品明细',
      headers: ['商品名称', '单价', '数量', '小计'],
      rows: o.items.map((i) => [
        i.name,
        `¥${i.price}`,
        i.qty,
        `¥${(i.price * i.qty).toLocaleString()}`,
      ]),
    },
  ])
}

async function updateStatus(status) {
  try {
    await store.save({ ...order.value, status })
    order.value.status = status
    toast.show(`订单已${statusMap[status]}`, 'success')
  } catch {
    toast.show('操作失败', 'error')
  }
}
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.info-row {
  display: flex;
  padding: 8px 0;
  font-size: 14px;
}
.info-label {
  width: 100px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.total-amount {
  font-weight: 700;
  color: var(--danger);
  font-size: 16px;
}
.tracking-num {
  font-weight: 600;
  color: var(--primary);
}
</style>
