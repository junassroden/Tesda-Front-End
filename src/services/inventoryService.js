import { api, notAvailable } from './api.js'

export const inventoryService = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`),
  create: (item) => api.post('/products', item),
  update: (id, item) => api.put(`/products/${id}`, item),
  remove: (id) => api.delete(`/products/${id}`),

  // Inventory requests from learning centers: no backend endpoint yet.
  requests: () => notAvailable('Inventory requests'),
}
