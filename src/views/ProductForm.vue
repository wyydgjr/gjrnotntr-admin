<template>
  <div>
    <div class="page-header">
      <h2>{{ isEdit ? '编辑产品' : '新增产品' }}</h2>
    </div>

    <div class="card" style="max-width: 520px">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>产品名称</label>
          <input
            v-model="form.name"
            class="form-control"
            :class="{ error: errors.name }"
            required
          />
          <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
        </div>
        <div class="form-group">
          <label>分类</label>
          <select v-model="form.category" class="form-control">
            <option value="" disabled>请选择分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>价格</label>
          <input
            v-model="form.price"
            class="form-control"
            type="number"
            step="0.01"
            :class="{ error: errors.price }"
            required
          />
          <p v-if="errors.price" class="form-error">{{ errors.price }}</p>
        </div>
        <div class="form-group">
          <label>库存</label>
          <input
            v-model="form.stock"
            class="form-control"
            type="number"
            :class="{ error: errors.stock }"
            required
          />
          <p v-if="errors.stock" class="form-error">{{ errors.stock }}</p>
        </div>
        <div class="form-group">
          <label>{{ $t('product.image') }}</label>
          <ImageUploader v-model="form.image" />
        </div>
        <div class="form-group">
          <label>商品简介</label>
          <textarea
            v-model="form.description"
            class="form-control"
            rows="3"
            placeholder="请输入商品简介"
          ></textarea>
        </div>
        <div class="form-group">
          <label>状态</label>
          <select v-model="form.status" class="form-control">
            <option value="active">上架</option>
            <option value="inactive">下架</option>
          </select>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 24px">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '保存' }}
          </button>
          <router-link to="/admin/products" class="btn">取消</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import { createResourceApi } from '../api/resource'
import ImageUploader from '../components/ImageUploader.vue'
import logger from '../utils/logger'

const route = useRoute()
const router = useRouter()
const store = useResourceStore('products', '/products')
const toast = useToastStore()
const categories = ref([])

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const errors = reactive({})

const form = ref({
  name: '',
  category: '',
  price: 0,
  stock: 0,
  image: '',
  description: '',
  status: 'active',
})

onMounted(async () => {
  try {
    const res = await createResourceApi('/categories').list({ page: 1, pageSize: 50 })
    categories.value = res.list || res || []
  } catch {}
  if (isEdit.value) loadProduct()
})

watch(
  () => route.params.id,
  () => {
    if (route.params.id) loadProduct()
    else resetForm()
  },
)

function validate() {
  const errs = {}
  if (!form.value.name.trim()) errs.name = '请输入产品名称'
  if (!form.value.price || form.value.price <= 0) errs.price = '请输入有效价格'
  if (form.value.stock < 0) errs.stock = '库存不能为负数'
  Object.assign(errors, errs)
  return Object.keys(errs).length === 0
}

async function loadProduct() {
  try {
    await store.fetchById(route.params.id)
    if (store.current) form.value = { ...store.current }
  } catch (e) {
    logger.error('Load product failed:', e)
    toast.show('加载产品失败', 'error')
    router.push('/admin/products')
  }
}

function resetForm() {
  form.value = {
    name: '',
    category: '',
    price: 0,
    stock: 0,
    image: '',
    description: '',
    status: 'active',
  }
  Object.keys(errors).forEach((k) => delete errors[k])
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await store.save(form.value)
    toast.show(isEdit.value ? '产品已更新' : '产品已创建', 'success')
    router.push('/admin/products')
  } catch {
    toast.show('保存失败', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
