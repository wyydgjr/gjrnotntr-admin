import request from './request'

export function createResourceApi(basePath) {
  return {
    list(params) {
      return request.get(basePath, { params })
    },
    get(id) {
      return request.get(`${basePath}/${id}`)
    },
    create(data) {
      return request.post(basePath, data)
    },
    update(id, data) {
      return request.put(`${basePath}/${id}`, data)
    },
    remove(id) {
      return request.delete(`${basePath}/${id}`)
    },
  }
}
