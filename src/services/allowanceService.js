import { notAvailable } from './api.js'

// Allowance has no backend endpoints yet. Replace these when the API exists.
export const allowanceService = {
  list: () => notAvailable('Allowance'),
  requests: () => notAvailable('Allowance requests'),
  get: () => notAvailable('Allowance details'),
  request: () => notAvailable('Allowance requests'),
}
