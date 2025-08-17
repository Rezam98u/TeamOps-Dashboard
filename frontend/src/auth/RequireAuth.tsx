import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}


