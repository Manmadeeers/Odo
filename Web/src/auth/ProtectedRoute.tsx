import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageLoader } from '../components/ui/FullPageLoader'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { user, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return <FullPageLoader />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
