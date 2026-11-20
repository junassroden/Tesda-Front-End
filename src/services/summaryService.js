import { api } from './api.js'

// Dashboard numbers: request/allowance counts by status, recent rows, batches, activity.
export const summaryService = {
  get: () => api.get('/summary'),
}
