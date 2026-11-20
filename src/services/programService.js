import { api } from './api.js'

// Programs are the NC courses stored by the backend (/courses), plus their batches and trainees.
export const programService = {
  list: () => api.get('/courses'),
  get: (id) => api.get(`/courses/${id}`),
  formOptions: () => api.get('/course-options'),
  create: (program) => api.post('/courses', program),
  update: (id, program) => api.put(`/courses/${id}`, program),
  remove: (id) => api.delete(`/courses/${id}`),

  batches: (courseId) => api.get(`/courses/${courseId}/batches`),
  createBatch: (courseId, batch) => api.post(`/courses/${courseId}/batches`, batch),
  centerBatches: () => api.get('/batches'),
  students: (batchId) => api.get(`/batches/${batchId}/students`),
}
