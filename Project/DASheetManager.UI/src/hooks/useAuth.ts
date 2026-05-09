import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { ChangePasswordRequest, LoginRequest, UpdateProfileRequest } from '@/types/da-types'

/**
 * Restores session on app load by calling GET /api/auth/me.
 * If the HttpOnly cookie is still valid, the server returns the current user.
 * If not authenticated (401), returns null without throwing.
 */
const SESSION_HINT = '_da_session'

export function useSession() {
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      // Skip the network call entirely when we know no session exists.
      // The browser always logs "Failed to load resource: 401" for failed fetches;
      // this hint avoids that noise on fresh page loads.
      if (localStorage.getItem(SESSION_HINT) !== '1') {
        setUser(null)
        return null
      }
      try {
        const user = await authApi.me()
        setUser(user)
        return user
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem(SESSION_HINT)
          setUser(null)
          return null
        }
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: async (user) => {
      localStorage.setItem(SESSION_HINT, '1')
      setUser(user)
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      navigate(user.mustChangePassword ? '/change-password' : '/dashboard')
    },
  })
}

export function useLogout() {
  const storeLogout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      localStorage.removeItem(SESSION_HINT)
      storeLogout()
      qc.clear()
      navigate('/login')
    },
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => authApi.updateProfile(body),
    onSuccess: (updated) => setUser(updated),
  })
}

export function useChangePassword() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => authApi.changePassword(body),
    onSuccess: async () => {
      // Refresh user from server so mustChangePassword = false is reflected
      try {
        const user = await authApi.me()
        setUser(user)
      } catch {
        // ignore
      }
      navigate('/dashboard')
    },
  })
}
