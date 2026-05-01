import { api } from './client'
import type {
  SheetListItem,
  SheetDetail,
  PagedResult,
  SheetSearchParams,
  CreateSheetRequest,
  TemplateListItem,
  TemplateDetail,
} from '@/types/da-types'

function toQueryString(params: SheetSearchParams): string {
  const sp = new URLSearchParams()
  if (params.search) sp.set('search', params.search)
  if (params.daType) sp.set('daType', params.daType)
  if (params.status) sp.set('status', params.status)
  sp.set('page', String(params.page ?? 1))
  sp.set('pageSize', String(params.pageSize ?? 10))
  return sp.toString()
}

export const sheetsApi = {
  search: (params: SheetSearchParams) =>
    api.get<PagedResult<SheetListItem>>(`/api/sheets?${toQueryString(params)}`),
  getById: (id: number) => api.get<SheetDetail>(`/api/sheets/${id}`),
  create: (body: CreateSheetRequest) => api.post<SheetDetail>('/api/sheets', body),
  update: (id: number, body: { name: string; notes?: string }) =>
    api.put<SheetDetail>(`/api/sheets/${id}`, body),
  delete: (id: number) => api.delete<void>(`/api/sheets/${id}`),
  duplicate: (id: number) => api.post<SheetDetail>(`/api/sheets/${id}/duplicate`),
  finalize: (id: number) => api.post<{ message: string }>(`/api/sheets/${id}/finalize`),
  publishedTemplates: () => api.get<TemplateListItem[]>('/api/sheets/templates'),
  templateDetail: (id: number) => api.get<TemplateDetail>(`/api/sheets/templates/${id}`),
}
