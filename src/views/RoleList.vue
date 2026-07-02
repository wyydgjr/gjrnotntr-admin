<template>
  <div>
    <div class="page-header">
      <h2>{{ $t('roles.title') }}</h2>
      <button class="btn btn-primary" @click="openCreate" v-if="permission.can('roles','create')">{{ $t('common.create') }}</button>
    </div>

    <div class="card">
      <table v-if="roles.length">
        <thead>
          <tr>
            <th>{{ $t('roles.roleName') }}</th>
            <th>{{ $t('roles.roleKey') }}</th>
            <th>{{ $t('roles.permissionCount') }}</th>
            <th>{{ $t('roles.createdAt') }}</th>
            <th>{{ $t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in roles" :key="r.id">
            <td>{{ r.label || r.name }}</td>
            <td><code>{{ r.value || r.key }}</code></td>
            <td>{{ Object.values(r.permissions || {}).flat().length }}</td>
            <td>{{ r.createdAt || '-' }}</td>
            <td>
              <button class="btn btn-sm" @click="openEdit(r)" v-if="permission.can('roles','edit')">{{ $t('common.edit') }}</button>
              <button class="btn btn-sm btn-danger" style="margin-left:4px" @click="doDelete(r)" v-if="permission.can('roles','delete') && !['super_admin','admin'].includes(r.value)">{{ $t('common.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state"><p>{{ $t('empty.default') }}</p></div>
    </div>

    <Modal v-if="formVisible" :title="editingRole?.id ? $t('common.edit') : $t('common.create')" @close="formVisible = false">
      <form @submit.prevent="doSave">
        <div class="form-group">
          <label>{{ $t('roles.roleName') }}</label>
          <input v-model="form.label" class="form-control" required />
        </div>
        <div class="form-group">
          <label>{{ $t('roles.roleKey') }}</label>
          <input v-model="form.value" class="form-control" required />
        </div>
        <div class="form-group">
          <label>{{ $t('roles.permissions') }}</label>
          <div class="perm-grid">
            <div v-for="(actions, resource) in allResources" :key="resource" class="perm-row">
              <span class="perm-resource">{{ $t(`nav.${resource}`) || resource }}</span>
              <label v-for="act in actions" :key="act" class="perm-check">
                <input type="checkbox" :value="act" v-model="form.permissions[resource]" />
                {{ act === 'view' ? '查看' : act === 'create' ? '新增' : act === 'edit' ? '编辑' : act === 'delete' ? '删除' : act === 'export' ? '导出' : act }}
              </label>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px">
          <button type="submit" class="btn btn-primary">{{ $t('common.save') }}</button>
          <button type="button" class="btn" @click="formVisible = false">{{ $t('common.cancel') }}</button>
        </div>
      </form>
    </Modal>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePermissionStore } from '../stores/permission'
import { useToastStore } from '../stores/toast'
import request from '../api/request'
import Modal from '../components/Modal.vue'
import Toast from '../components/Toast.vue'

const permission = usePermissionStore()
const toast = useToastStore()
const roles = ref([])
const formVisible = ref(false)
const editingRole = ref(null)
const form = ref({ label: '', value: '', permissions: {} })

const allResources = {
  dashboard: ['view'],
  users: ['view', 'create', 'edit', 'delete'],
  products: ['view', 'create', 'edit', 'delete'],
  categories: ['view', 'create', 'edit', 'delete'],
  orders: ['view', 'edit', 'delete', 'export'],
  coupons: ['view', 'create', 'edit', 'delete'],
  banners: ['view', 'create', 'edit', 'delete'],
  reviews: ['view', 'delete'],
  afterSales: ['view', 'edit'],
  invoices: ['view', 'edit'],
  suppliers: ['view', 'create', 'edit', 'delete'],
  purchaseOrders: ['view', 'create', 'edit', 'delete'],
  specTemplates: ['view', 'create', 'edit', 'delete'],
  auditLogs: ['view'],
  settings: ['view', 'edit'],
  reports: ['view', 'export'],
  inventory: ['view', 'edit'],
  roles: ['view', 'create', 'edit', 'delete'],
}

async function fetchRoles() {
  try {
    const res = await request.get('/roles')
    roles.value = res.list || res
  } catch {
    roles.value = []
  }
}

function openCreate() {
  editingRole.value = null
  form.value = { label: '', value: '', permissions: {} }
  formVisible.value = true
}

function openEdit(r) {
  editingRole.value = r
  form.value = { label: r.label, value: r.value, permissions: { ...r.permissions } || {} }
  formVisible.value = true
}

async function doSave() {
  try {
    if (editingRole.value?.id) {
      await request.put(`/roles/${editingRole.value.id}`, form.value)
    } else {
      await request.post('/roles', form.value)
    }
    toast.show('保存成功', 'success')
    formVisible.value = false
    fetchRoles()
  } catch {
    toast.show('保存失败', 'error')
  }
}

async function doDelete(r) {
  if (!confirm(`确定删除角色「${r.label}」？`)) return
  try {
    await request.delete(`/roles/${r.id}`)
    toast.show('已删除', 'success')
    fetchRoles()
  } catch {
    toast.show('删除失败', 'error')
  }
}

onMounted(fetchRoles)
</script>

<style scoped>
.perm-grid { max-height: 400px; overflow-y: auto; }
.perm-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); gap: 12px; }
.perm-resource { min-width: 100px; font-weight: 500; font-size: 13px; }
.perm-check { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
</style>
