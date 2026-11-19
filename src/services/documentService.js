import { API_BASE, api } from './api.js'

const fileForm = (file) => {
  const form = new FormData()
  form.append('document_file', file)
  return form
}

export const documentService = {
  // Archive (TESDA main office)
  list: () => api.get('/documents'),
  upload: (file) => api.upload('/documents', fileForm(file)),
  downloadUrl: (id) => `${API_BASE}/documents/${id}/download`,

  // Archive assistant chat (history is kept in the server session)
  chatHistory: () => api.get('/documents/chat'),
  ask: (question) => api.post('/documents/chat', { question }),
  clearChat: () => api.delete('/documents/chat'),

  // Document AI lab
  analyzeImage: (file) => api.upload('/document-ai/analyze', fileForm(file)),
  analyzeSample: () => api.post('/document-ai/sample'),
  classifyText: (text) => api.post('/document-ai/text', { ocr_text: text }),
}
