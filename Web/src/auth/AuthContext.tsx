import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type AuthSession } from '../api/auth-api'
import { ApiError } from '../api/http'
import { AuthContext, type AuthContextValue } from './auth-context'

const REFRESH_TOKEN_KEY = 'odo.auth.refreshToken'

let initialSessionPromise: Promise<AuthSession | null> | null = null

function restoreInitialSession() {
  if (!initialSessionPromise) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    initialSessionPromise = refreshToken
      ? authApi.refresh(refreshToken).catch(() => null)
      : Promise.resolve(null)
  }

  return initialSessionPromise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const sessionRef = useRef<AuthSession | null>(null)
  const refreshPromiseRef = useRef<Promise<AuthSession> | null>(null)

  const saveSession = useCallback((nextSession: AuthSession) => {
    sessionRef.current = nextSession
    initialSessionPromise = Promise.resolve(nextSession)
    setSession(nextSession)
    localStorage.setItem(REFRESH_TOKEN_KEY, nextSession.refreshToken)
  }, [])

  const clearSession = useCallback(() => {
    sessionRef.current = null
    initialSessionPromise = Promise.resolve(null)
    setSession(null)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }, [])

  useEffect(() => {
    let active = true

    void restoreInitialSession().then((restoredSession) => {
      if (!active) return

      if (restoredSession) {
        saveSession(restoredSession)
      } else {
        clearSession()
      }
      setIsInitializing(false)
    })

    return () => {
      active = false
    }
  }, [clearSession, saveSession])

  const refreshSession = useCallback(() => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!refreshToken) {
      return Promise.reject(new ApiError(401, 'Your session has expired'))
    }

    const refreshPromise = authApi
      .refresh(refreshToken)
      .then((nextSession) => {
        saveSession(nextSession)
        return nextSession
      })
      .catch((error: unknown) => {
        clearSession()
        throw error
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    refreshPromiseRef.current = refreshPromise
    return refreshPromise
  }, [clearSession, saveSession])

  const runAuthenticated = useCallback(
    async <T,>(operation: (accessToken: string) => Promise<T>) => {
      const currentSession = sessionRef.current ?? (await refreshSession())

      try {
        return await operation(currentSession.accessToken)
      } catch (error: unknown) {
        if (
          !(error instanceof ApiError) ||
          error.status !== 401 ||
          error.message === 'Current password is incorrect'
        ) {
          throw error
        }

        const renewedSession = await refreshSession()
        return operation(renewedSession.accessToken)
      }
    },
    [refreshSession],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      saveSession(await authApi.login(email, password))
    },
    [saveSession],
  )

  const logout = useCallback(async () => {
    try {
      if (sessionRef.current || localStorage.getItem(REFRESH_TOKEN_KEY)) {
        await runAuthenticated((accessToken) => authApi.logout(accessToken))
      }
    } catch {
      // Local sign-out must still succeed when the API is unavailable.
    } finally {
      clearSession()
    }
  }, [clearSession, runAuthenticated])

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await runAuthenticated((accessToken) =>
        authApi.changePassword(accessToken, currentPassword, newPassword),
      )
    },
    [runAuthenticated],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isInitializing,
      login,
      logout,
      changePassword,
    }),
    [changePassword, isInitializing, login, logout, session?.user],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
