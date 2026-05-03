import { api } from './client'
import type { AdminResetPasswordRequest, CreateUserRequest, UserListItem } from '@/types/da-types'

export const usersApi = {
  getAll: () => api.get<UserListItem[]>('/api/users'),
  create: (body: CreateUserRequest) => api.post<UserListItem>('/api/users', body),
  toggleActive: (userId: number) => api.post<{ message: string }>(`/api/users/${userId}/toggle-active`),
  resetPassword: (userId: number, body: AdminResetPasswordRequest) =>
    api.post<{ message: string }>(`/api/users/${userId}/reset-password`, body),
  deleteUser: (userId: number) => api.delete<{ message: string }>(`/api/users/${userId}`),
}
