import { api } from './api.js'

// The signed-in teacher's classes (/instructor endpoints) plus the shared program and batch endpoints.
export const teacherService = {
  overview: () => api.get('/instructor'), // { courses, students, enrollments } at the teacher's center
  myBatches: () => api.get('/instructor/batches'),
  program: (id) => api.get(`/courses/${id}`), // { course, roster, materials }
  batches: (programId) => api.get(`/courses/${programId}/batches`),
  openBatch: (programId, batch) => api.post(`/courses/${programId}/batches`, batch),
  updateSchedule: (programId, details) => api.put(`/instructor/courses/${programId}`, details), // { class_days, class_schedule, course_outline }
  addMaterial: (programId, material) => api.post(`/instructor/courses/${programId}/materials`, material), // { title, description, resource_url }
}
