import { API_BASE, api } from './api.js'

// Main office stock (/products), supply requests, and delivery personnel.
export const inventoryService = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`), // admin only
  create: (item) => api.post('/products', item),
  update: (id, item) => api.put(`/products/${id}`, item),
  remove: (id) => api.delete(`/products/${id}`),

  // Item photos. The URL includes the stored file name, so a new photo is never served from cache.
  imageUrl: (product) => (product?.image_path ? `${API_BASE}/products/${product.id}/image?v=${encodeURIComponent(product.image_path)}` : null),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('image', file)
    return api.upload(`/products/${id}/image`, form)
  },
  removeImage: (id) => api.delete(`/products/${id}/image`),

  // Supply requests from learning centers
  requests: () => api.get('/inventory-requests'),
  request: (id) => api.get(`/inventory-requests/${id}`),
  createRequest: (payload) => api.post('/inventory-requests', payload), // { items: [{product_id, quantity}], delivery_personnel_id, purpose }
  review: (id, decision, remarks = '') => api.post(`/inventory-requests/${id}/review`, { decision, remarks }),
  release: (id) => api.post(`/inventory-requests/${id}/release`),
  markReceived: (id) => api.post(`/inventory-requests/${id}/received`),

  // Delivery personnel of the signed-in center
  deliveryPersonnel: () => api.get('/delivery-personnel'),
  addDeliveryPerson: (person) => api.post('/delivery-personnel', person),
}
