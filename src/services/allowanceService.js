import { api } from './api.js'

// Training allowance requests (one per batch) and the per-trainee checklist.
export const allowanceService = {
  list: () => api.get('/allowance-requests'),
  get: (id) => api.get(`/allowance-requests/${id}`),
  request: (payload) => api.post('/allowance-requests', payload), // { batch_id, amount_per_student, notes }
  checkStudent: (id, studentId, checked) => api.put(`/allowance-requests/${id}/students/${studentId}`, { checked }),
  setStatus: (id, status, remarks = '') => api.post(`/allowance-requests/${id}/status`, { status, remarks }),
}
