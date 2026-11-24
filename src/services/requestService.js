import { API_BASE, api } from './api.js'

const filesForm = (files, fields = {}) => {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => form.append(key, value))
  Array.from(files ?? []).forEach((file) => form.append('files[]', file))
  return form
}

// Inventory requests: learning center drafts and submits, the main office approves,
// inventory personnel prepare and generate the QR delivery.
// Every call answers with { request, items, files, delivery, activity } (plus message).
export const requestService = {
  list: (statuses = []) => api.get(`/inventory-requests${statuses.length ? `?status=${statuses.join(',')}` : ''}`),
  get: (id) => api.get(`/inventory-requests/${id}`),
  createDraft: (draft) => api.post('/inventory-requests', draft),
  updateDraft: (id, draft) => api.put(`/inventory-requests/${id}`, draft),
  deleteDraft: (id) => api.delete(`/inventory-requests/${id}`),
  /** kind: 'letter' | 'attachment' */
  upload: (id, kind, files) => api.upload(`/inventory-requests/${id}/files`, filesForm(files, { kind })),
  removeFile: (id, fileId) => api.delete(`/inventory-requests/${id}/files/${fileId}`),
  submit: (id) => api.post(`/inventory-requests/${id}/submit`, {}),
  /** decision: 'approved' | 'rejected' */
  review: (id, decision, remarks = '') => api.post(`/inventory-requests/${id}/review`, { decision, remarks }),
  startProcessing: (id) => api.post(`/inventory-requests/${id}/processing`, {}),
  generateQr: (id) => api.post(`/inventory-requests/${id}/qr`, {}),
  /** items: [{ id, quantity_received }] */
  receive: (id, items, notes) => api.post(`/inventory-requests/${id}/receive`, { items, notes }),
  resolve: (id, remarks) => api.post(`/inventory-requests/${id}/resolve`, { remarks }),
  fileUrl: (fileId) => `${API_BASE}/inventory-request-files/${fileId}`,
  fileDownloadUrl: (fileId) => `${API_BASE}/inventory-request-files/${fileId}?download=1`,
}

// Delivery Management: stock is deducted only by release(), after a QR scan.
export const deliveryService = {
  list: (statuses = []) => api.get(`/deliveries${statuses.length ? `?status=${statuses.join(',')}` : ''}`),
  get: (id) => api.get(`/deliveries/${id}`),
  /** code: the scanned QR text, or a typed reference number such as DLV-2026-0001 */
  scan: (code) => api.post('/deliveries/scan', { code }),
  release: (id, code) => api.post(`/deliveries/${id}/release`, { code, confirm: 1 }),
  delivered: (id) => api.post(`/deliveries/${id}/delivered`, {}),
}

// Main office staff accounts (admin) and the signed-in user's notifications.
export const staffService = {
  list: () => api.get('/staff'),
  create: (person) => api.post('/staff', person),
  setActive: (id, active) => api.put(`/staff/${id}/active`, { is_active: active ? 1 : 0 }),
}

export const notificationService = {
  list: () => api.get('/notifications'),
  read: (id) => api.post('/notifications/read', id ? { id } : {}),
}
