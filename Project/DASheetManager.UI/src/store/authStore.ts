import { create } from 'zustand'
import type { CurrentUser } from '@/types/da-types'

interface AuthState {
  user: CurrentUser | null
  isAuthenticated: boolean
  setUser: (user: CurrentUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
