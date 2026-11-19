import { api, notAvailable } from './api.js'

// Programs are the NC courses stored by the backend (/courses).
// Batches and batch student lists have no endpoints yet.
export const programService = {
  list: () => api.get('/courses'),
  get: (id) => api.get(`/courses/${id}`),
  formOptions: () => api.get('/course-options'),
  create: (program) => api.post('/courses', program),
  update: (id, program) => api.put(`/courses/${id}`, program),
  remove: (id) => api.delete(`/courses/${id}`),

  batches: () => notAvailable('Batch lists'),
  students: () => notAvailable('Student lists'),
}
