import { Loader2 } from 'lucide-react'
import { useSession } from '@/hooks/useAuth'

/**
 * Wraps the app and calls GET /api/auth/me once on mount.
 * If the HttpOnly JWT cookie is valid, the Zustand authStore is populated
 * before any route guard runs — preventing a flash-to-login.
 */
export function SessionLoader({ children }: { children: React.ReactNode }) {
  const { isLoading } = useSession()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return <>{children}</>
}
