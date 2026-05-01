import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  adminOnly?: boolean
}

/**
 * Redirects to /login if not authenticated.
 * If adminOnly is true, redirects to /dashboard if the user is not an admin.
 */
export function ProtectedRoute({ adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'Admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
