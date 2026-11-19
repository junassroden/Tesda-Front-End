import { createContext, useEffect, useState } from 'react'
import { onUnauthorized } from '../services/api.js'
import { authService } from '../services/authService.js'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

/** Holds the signed-in user (from the LavaLust session) for the whole app. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still checking

  useEffect(() => {
    onUnauthorized(() => setUser(null))
    authService
      .session()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, setUser, login, logout }}>{children}</AuthContext.Provider>
}
