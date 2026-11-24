import { api } from './api.js'

// Blockchain ledger (main office administrators).
export const ledgerService = {
  /** filters: { page, entity_type, entity_id, q } */
  list: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)).toString()
    return api.get(`/ledger${query ? `?${query}` : ''}`)
  },
  block: (id) => api.get(`/ledger/${id}`),
  verifyChain: () => api.post('/ledger/verify', {}),
  verifyBlock: (id) => api.post(`/ledger/${id}/verify`, {}),
}

// Public anchoring (OpenTimestamps / Bitcoin).
export const anchorService = {
  list: () => api.get('/ledger/anchors'),
  anchorNow: () => api.post('/ledger/anchors', {}),
  checkConfirmations: () => api.post('/ledger/anchors/check', {}),
  verify: (id) => api.post(`/ledger/anchors/${id}/verify`, {}),
}

// QR-verifiable printed documents.
export const sealService = {
  /** kind: student_info | student_checklist | enrollment_packet | batch_records */
  issue: (kind, entityId) => api.post('/seals', { kind, entity_id: entityId }),
  /** Public: no login needed. */
  verify: (token) => api.get(`/public/verify/${encodeURIComponent(token)}`),
}
