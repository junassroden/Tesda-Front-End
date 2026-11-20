// HTTP client for the LavaLust JSON endpoints (Back-End/app/config/routes.php).
// The session cookie authenticates every request. The backend refuses any
// request that changes data unless it carries the X-Requested-With header.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/app'

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message)
    this.status = status
    this.errors = errors.length ? errors : [message]
  }
}

let unauthorizedHandler = null

/** Called by AuthContext so an expired session logs the user out everywhere. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export async function request(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(API_BASE + path, { method, headers, body: payload, credentials: 'include' })
  } catch {
    throw new ApiError('The server could not be reached. Check that the backend is running.', 0)
  }

  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler && path !== '/login') unauthorizedHandler()
    // The Vite proxy answers 502/504 when the backend is down.
    if ((response.status === 502 || response.status === 504) && !data?.error) {
      throw new ApiError('The server could not be reached. Check that the backend is running.', response.status)
    }
    throw new ApiError(data?.error || `Request failed (${response.status}).`, response.status, data?.errors || [])
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, form) => request(path, { method: 'POST', form }),
}

/** Rejects with a clear message for features the backend does not have yet. */
export function notAvailable(feature) {
  return Promise.reject(new ApiError(`${feature} is not available yet.`, 501))
}

/** The backend wraps lists differently per endpoint; accept an array or the first array field. */
export function toList(data) {
  if (Array.isArray(data)) return data
  const firstArray = data && Object.values(data).find(Array.isArray)
  return firstArray ?? []
}
