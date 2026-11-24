import { createContext, useContext } from 'react'

/** The current portal's name ("Main office", "Teacher", ...), set by PortalLayout. */
const PortalContext = createContext('')

export const PortalProvider = PortalContext

// eslint-disable-next-line react-refresh/only-export-components
export function usePortalName() {
  return useContext(PortalContext)
}
