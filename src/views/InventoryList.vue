<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('inventory.title') }}</h2>
      <div style="display:flex;gap:8px">
        <input v-model="keyword" class="form-control" :placeholder="$t('common.search') + '...'" style="width:200px" @keyup.enter="fetchData" />
        <select v-model="stockFilter" class="form-control" style="width:140px" @change="fetchData">
          <option value="">{{ $t('inventory.allProducts') }}</option>
          <option value="low">{{ $t('inventory.lowStock') }}</option>
          <option value="out">{{ $t('product.outOfStock') }}</option>
          <option value="ok">{{ $t('inventory.normal') }}</option>
        </select>
        <button class="btn" @click="fetchData">{{ $t('common.search') }}</button>
        <button class="btn btn-primary" @click="showLog = true">{{ $t('inventory.stockLog') }}</button>
      </div>
    </div>

    <div class="card">
      <div class="inventory-stats">
        <div class="stat-item stat-warn">
          <span class="stat-num">{{ lowStockCount }}</span>
          <span class="stat-label">{{ $t('inventory.lowStockAlert') }}</span>
        </div>
        <div class="stat-item stat-danger">
          <span class="stat-num">{{ outOfStockCount }}</span>
          <span class="stat-label">{{ $t('inventory.outOfStockAlert') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ totalProducts }}</span>
          <span class="stat-label">{{ $t('inventory.totalProducts') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">¥{{ totalValue.toLocaleString() }}</span>
          <span class="stat-label">{{ $t('inventory.totalValue') }}</span>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <table v-if="list.length">
        <thead>
          <tr>
            <th>{{ $t('product.name') }}</th>
            <th>{{ $t('product.category') }}</th>
            <th>{{ $t('product.price') }}</th>
            <th>{{ $t('product.stock') }}</th>
            <th>{{ $t('inventory.safeStock') }}</th>
            <th>{{ $t('inventory.status') }}</th>
            <th>{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in list" :key="p.id" :class="{ 'row-warn': p.stock < (p.safeStock || 20) && p.stock > 0, 'row-danger': p.stock === 0 }">
            <td>{{ p.name }}</td>
            <td>{{ p.category }}</td>
            <td>¥{{ p.price }}</td>
            <td>
              <span class="stock-value">{{ p.stock }}</span>
            </td>
            <td>{{ p.safeStock || 20 }}</td>
            <td>
              <span class="badge" :class="stockBadgeClass(p)">{{ stockStatus(p) }}</span>
            </td>
            <td>
              <button class="btn btn-sm" @click="openAdjust(p)">{{ $t('inventory.adjust') }}</button>
              <button class="btn btn-sm" style="margin-left:4px" @click="viewLog(p)">{{ $t('inventory.stockLog') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>{{ $t('empty.default') }}</p></div>
    </div>

    <!-- 库存调整弹窗 -->
    <Modal v-if="adjustVisible" :title="$t('inventory.adjust') + ' - ' + adjustProduct?.name" @close="adjustVisible = false">
      <form @submit.prevent="doAdjust">
        <div class="form-group">
          <label>{{ $t('inventory.currentStock') }}</label>
          <input class="form-control" :value="adjustProduct?.stock" disabled />
        </div>
        <div class="form-group">
          <label>{{ $t('inventory.adjustType') }}</label>
          <select v-model="adjustType" class="form-control">
            <option value="in">{{ $t('inventory.stockIn') }}</option>
            <option value="out">{{ $t('inventory.stockOut') }}</option>
            <option value="set">{{ $t('inventory.stockSet') }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('inventory.adjustQty') }}</label>
          <input v-model.number="adjustQty" class="form-control" type="number" min="0" required />
        </div>
        <div class="form-group">
          <label>{{ $t('inventory.remark') }}</label>
          <input v-model="adjustRemark" class="form-control" :placeholder="$t('inventory.remark')" />
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button type="submit" class="btn btn-primary">{{ $t('common.confirm') }}</button>
          <button type="button" class="btn" @click="adjustVisible = false">{{ $t('common.cancel') }}</button>
        </div>
      </form>
    </Modal>

    <!-- 库存日志弹窗 -->
    <Modal v-if="showLog" :title="$t('inventory.stockLog')" @close="showLog = false" width="700">
      <table v-if="stockLogs.length">
        <thead>
          <tr><th>{{ $t('product.name') }}</th><th>{{ $t('inventory.adjustType') }}</th><th>{{ $t('inventory.qty') }}</th><th>{{ $t('inventory.before') }}</th><th>{{ $t('inventory.after') }}</th><th>{{ $t('inventory.remark') }}</th><th>{{ $t('order.createdAt') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in stockLogs" :key="log.id">
            <td>{{ log.productName }}</td>
            <td>{{ log.type === 'in' ? '入库' : log.type === 'out' ? '出库' : '盘点' }}</td>
            <td>{{ log.type === 'in' ? '+' : '-' }}{{ log.qty }}</td>
            <td>{{ log.before }}</td>
            <td>{{ log.after }}</td>
            <td>{{ log.remark || '-' }}</td>
            <td>{{ log.createdAt }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>{{ $t('empty.default') }}</p></div>
    </Modal>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../api/request'
import { useToastStore } from '../stores/toast'
import Modal from '../components/Modal.vue'
import Toast from '../components/Toast.vue'

const toast = useToastStore()
const list = ref([])
const stockLogs = ref([])
const keyword = ref('')
const stockFilter = ref('')
const adjustVisible = ref(false)
const adjustProduct = ref(null)
const adjustType = ref('in')
const adjustQty = ref(0)
const adjustRemark = ref('')
const showLog = ref(false)

const lowStockCount = computed(() => list.value.filter(p => p.stock > 0 && p.stock < (p.safeStock || 20)).length)
const outOfStockCount = computed(() => list.value.filter(p => p.stock === 0).length)
const totalProducts = computed(() => list.value.length)
const totalValue = computed(() => list.value.reduce((s, p) => s + p.price * p.stock, 0))

function stockStatus(p) {
  if (p.stock === 0) return '缺货'
  if (p.stock < (p.safeStock || 20)) return '低库存'
  return '正常'
}
function stockBadgeClass(p) {
  if (p.stock === 0) return 'badge-cancelled'
  if (p.stock < (p.safeStock || 20)) return 'badge-pending'
  return 'badge-completed'
}

async function fetchData() {
  try {
    const params = {}
    if (keyword.value) params.keyword = keyword.value
    const res = await request.get('/products', { params })
    list.value = res.list || res
    if (stockFilter.value === 'low') list.value = list.value.filter(p => p.stock > 0 && p.stock < (p.safeStock || 20))
    if (stockFilter.value === 'out') list.value = list.value.filter(p => p.stock === 0)
    if (stockFilter.value === 'ok') list.value = list.value.filter(p => p.stock >= (p.safeStock || 20))
  } catch {
    toast.show('加载库存失败', 'error')
  }
}

function openAdjust(p) {
  adjustProduct.value = p
  adjustType.value = 'in'
  adjustQty.value = 0
  adjustRemark.value = ''
  adjustVisible.value = true
}

async function doAdjust() {
  if (!adjustQty.value || adjustQty.value <= 0) {
    toast.show('请输入有效数量', 'warning')
    return
  }
  const p = adjustProduct.value
  let newStock = p.stock
  if (adjustType.value === 'in') newStock += adjustQty.value
  else if (adjustType.value === 'out') newStock = Math.max(0, newStock - adjustQty.value)
  else newStock = adjustQty.value

  try {
    await request.put(`/products/${p.id}`, { ...p, stock: newStock })
    // 记录库存日志
    await request.post('/stock-logs', {
      productId: p.id,
      productName: p.name,
      type: adjustType.value,
      qty: adjustQty.value,
      before: p.stock,
      after: newStock,
      remark: adjustRemark.value,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    })
    p.stock = newStock
    toast.show('库存已更新', 'success')
    adjustVisible.value = false
  } catch {
    toast.show('操作失败', 'error')
  }
}

async function viewLog(p) {
  try {
    const res = await request.get('/stock-logs', { params: { productId: p.id } })
    stockLogs.value = (res.list || res).slice(0, 50)
    showLog.value = true
  } catch {
    stockLogs.value = []
    showLog.value = true
  }
}

onMounted(fetchData)
</script>

<style scoped>
.inventory-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-item { text-align: center; padding: 16px; border-radius: 8px; background: var(--bg); }
.stat-warn { background: #fff3cd; }
.stat-danger { background: #f8d7da; }
.stat-num { font-size: 24px; font-weight: 700; display: block; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-top: 4px; display: block; }
.stock-value { font-weight: 600; }
.row-warn { background: #fff9e6; }
.row-danger { background: #fff0f0; }
@media (max-width: 768px) { .inventory-stats { grid-template-columns: repeat(2, 1fr); } }
</style>
