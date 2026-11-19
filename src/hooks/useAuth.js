import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

/** { user, setUser, login, logout }. `user` is undefined while the session loads. */
export function useAuth() {
  return useContext(AuthContext)
}
