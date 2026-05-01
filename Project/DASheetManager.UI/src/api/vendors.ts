import { api } from './client'
import type { AddVendorRequest, VendorDto } from '@/types/da-types'

export const vendorsApi = {
  add: (sheetId: number, body: AddVendorRequest) =>
    api.post<{ success: boolean; vendor: VendorDto }>(`/api/sheets/${sheetId}/vendors`, body),
  update: (sheetId: number, vendorId: number, body: AddVendorRequest) =>
    api.put<{ success: boolean }>(`/api/sheets/${sheetId}/vendors/${vendorId}`, body),
  delete: (sheetId: number, vendorId: number) =>
    api.delete<{ success: boolean }>(`/api/sheets/${sheetId}/vendors/${vendorId}`),
}
