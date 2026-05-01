import { api } from './client'
import type { ChangePasswordRequest, CurrentUser, LoginRequest } from '@/types/da-types'

export const authApi = {
  login: (body: LoginRequest) => api.post<CurrentUser>('/api/auth/login', body),
  logout: () => api.post<{ message: string }>('/api/auth/logout'),
  me: () => api.get<CurrentUser>('/api/auth/me'),
  changePassword: (body: ChangePasswordRequest) =>
    api.post<{ message: string }>('/api/auth/change-password', body),
}
