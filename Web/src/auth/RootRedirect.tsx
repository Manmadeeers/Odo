import { Navigate } from 'react-router'
import { FullPageLoader } from '../components/ui/FullPageLoader'
import { useAuth } from './useAuth'

export function RootRedirect() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) return <FullPageLoader />

  return <Navigate to={user ? '/account' : '/login'} replace />
}
