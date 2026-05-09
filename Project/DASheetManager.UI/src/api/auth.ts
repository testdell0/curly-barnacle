import { api } from './client'
import type { ChangePasswordRequest, CurrentUser, LoginRequest, UpdateProfileRequest } from '@/types/da-types'

export const authApi = {
  login: (body: LoginRequest) => api.post<CurrentUser>('/api/auth/login', body),
  logout: () => api.post<{ message: string }>('/api/auth/logout'),
  me: () => api.get<CurrentUser>('/api/auth/me'),
  changePassword: (body: ChangePasswordRequest) =>
    api.post<{ message: string }>('/api/auth/change-password', body),
  updateProfile: (body: UpdateProfileRequest) => api.put<CurrentUser>('/api/auth/profile', body),
  getCaptcha: () => api.get<{ imageData: string; token: string }>('/api/auth/captcha'),
}
