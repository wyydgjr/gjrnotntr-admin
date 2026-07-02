import { defineStore } from 'pinia'
import { createResourceApi } from '../api/resource'

export function useResourceStore(namespace, basePath) {
  const api = createResourceApi(basePath)
  return defineStore(namespace, {
    state: () => ({
      list: [],
      total: 0,
      current: null,
      loading: false,
      query: { page: 1, pageSize: 20, keyword: '' },
    }),
    actions: {
      async fetchList(params) {
        this.loading = true
        try {
          Object.assign(this.query, params || {})
          const res = await api.list(this.query)
          this.list = res.list || res.data || res
          this.total = res.total || this.list.length
        } finally {
          this.loading = false
        }
      },
      async fetchById(id) {
        this.current = await api.get(id)
      },
      async save(data) {
        if (data.id) {
          await api.update(data.id, data)
        } else {
          await api.create(data)
        }
      },
      async remove(id) {
        await api.remove(id)
        this.list = this.list.filter((item) => item.id !== id)
        this.total--
      },
    },
  })()
}
