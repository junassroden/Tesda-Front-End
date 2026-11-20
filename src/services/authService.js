import { api } from './api.js'

export const authService = {
  session: () => api.get('/session'),
  login: (email, password) => api.post('/login', { email, password }),
  logout: () => api.post('/logout'),
}
