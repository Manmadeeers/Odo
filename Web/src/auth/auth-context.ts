import { createContext } from 'react'
import type { AuthenticatedUser } from '../api/auth-api'

export interface AuthContextValue {
  user: AuthenticatedUser | null
  isInitializing: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
