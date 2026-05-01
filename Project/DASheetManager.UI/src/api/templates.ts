import { api } from './client'
import type {
  TemplateListItem,
  TemplateDetail,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '@/types/da-types'

export const templatesApi = {
  list: () => api.get<TemplateListItem[]>('/api/templates'),
  getById: (id: number) => api.get<TemplateDetail>(`/api/templates/${id}`),
  create: (body: CreateTemplateRequest) => api.post<TemplateDetail>('/api/templates', body),
  update: (id: number, body: UpdateTemplateRequest) => api.put<TemplateDetail>(`/api/templates/${id}`, body),
  delete: (id: number) => api.delete<void>(`/api/templates/${id}`),
  publish: (id: number) => api.post<{ message: string }>(`/api/templates/${id}/publish`),
  unpublish: (id: number) => api.post<{ message: string }>(`/api/templates/${id}/unpublish`),
}
