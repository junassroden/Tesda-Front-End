import { API_BASE, api } from './api.js'

const filesForm = (files, fields = {}) => {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value)
  })
  Array.from(files ?? []).forEach((file) => form.append('files[]', file))
  return form
}

// Batches of a course: schedule, lifecycle, trainees, attendance, history.
export const batchService = {
  forCourse: (courseId) => api.get(`/courses/${courseId}/batches`),
  create: (courseId, batch) => api.post(`/courses/${courseId}/batches`, batch),
  get: (id) => api.get(`/batches/${id}`), // { batch, students, sessions, activity, can_manage, can_record_attendance }
  update: (id, batch) => api.put(`/batches/${id}`, batch),
  assignTeacher: (id, instructorId) => api.put(`/batches/${id}/instructor`, { instructor_id: instructorId || 0 }),
  /** action: suspend | resume | extend | complete | cancel */
  changeStatus: (id, action, { reason = '', end_date = '' } = {}) => api.post(`/batches/${id}/status`, { action, reason, end_date }),
  enroll: (id, studentId) => api.post(`/batches/${id}/students`, { student_id: studentId }),
  remove: (id, studentId, reason) => api.post(`/batches/${id}/students/${studentId}/remove`, { reason }),
  transfer: (id, studentId, targetBatchId, reason) => api.post(`/batches/${id}/students/${studentId}/transfer`, { batch_id: targetBatchId, reason }),
  recordSession: (id, session) => api.post(`/batches/${id}/sessions`, session),
  deleteSession: (id, sessionId) => api.delete(`/batches/${id}/sessions/${sessionId}`),
  history: (filters = {}) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)).toString()
    return api.get(`/batches/history${query ? `?${query}` : ''}`)
  },
  instructors: () => api.get('/center/instructors'),
}

// The learning center's student records and their enrollment documents.
export const studentRecordService = {
  search: (q = '') => api.get(`/center/students${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create: (student) => api.post('/center/students', student),
  get: (id) => api.get(`/center/students/${id}`),
  update: (id, student) => api.put(`/center/students/${id}`, student),
  uploadFor: (studentId, typeId, files) => api.upload(`/center/students/${studentId}/documents/${typeId}`, filesForm(files)),
  /** action: under_review | verified | rejected */
  review: (documentId, action, remarks = '') => api.post(`/student-documents/${documentId}/review`, { action, remarks }),
}

// Document copies, shared by students and the learning center (the server checks who may open each file).
export const documentFiles = {
  url: (fileId) => `${API_BASE}/student-document-files/${fileId}`,
  downloadUrl: (fileId) => `${API_BASE}/student-document-files/${fileId}?download=1`,
  remove: (fileId) => api.delete(`/student-document-files/${fileId}`),
}

// The signed-in student.
export const studentService = {
  training: () => api.get('/student/training'),
  profile: () => api.get('/student/profile'),
  updateProfile: (profile) => api.put('/student/profile', profile),
  documents: () => api.get('/student/documents'),
  upload: (typeId, files) => api.upload(`/student/documents/${typeId}`, filesForm(files)),
}

// Virtual classroom (teachers and students).
export const classroomService = {
  list: () => api.get('/classrooms'),
  get: (batchId) => api.get(`/classrooms/${batchId}`),
  announce: (batchId, post) => api.post(`/classrooms/${batchId}/announcements`, post),
  deleteAnnouncement: (batchId, id) => api.delete(`/classrooms/${batchId}/announcements/${id}`),
  createItem: (batchId, fields, files) => api.upload(`/classrooms/${batchId}/items`, filesForm(files, fields)),
  deleteItem: (itemId) => api.delete(`/classroom-items/${itemId}`),
  submissions: (itemId) => api.get(`/classroom-items/${itemId}/submissions`),
  submit: (itemId, answerText, files) => api.upload(`/classroom-items/${itemId}/submission`, filesForm(files, { answer_text: answerText })),
  grade: (submissionId, grade, feedback) => api.post(`/classroom-submissions/${submissionId}/grade`, { grade, feedback }),
  fileUrl: (fileId) => `${API_BASE}/classroom-files/${fileId}`,
  downloadUrl: (fileId) => `${API_BASE}/classroom-files/${fileId}?download=1`,
  deleteFile: (fileId) => api.delete(`/classroom-files/${fileId}`),
}
