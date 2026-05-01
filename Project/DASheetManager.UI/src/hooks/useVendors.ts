import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsApi } from '@/api/vendors'
import type { AddVendorRequest } from '@/types/da-types'

export function useAddVendor(sheetId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddVendorRequest) => vendorsApi.add(sheetId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sheet', sheetId] })
      qc.invalidateQueries({ queryKey: ['evaluations', sheetId] })
      qc.invalidateQueries({ queryKey: ['scores', sheetId] })
    },
  })
}

export function useUpdateVendor(sheetId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ vendorId, body }: { vendorId: number; body: AddVendorRequest }) =>
      vendorsApi.update(sheetId, vendorId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sheet', sheetId] })
    },
  })
}

export function useDeleteVendor(sheetId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vendorId: number) => vendorsApi.delete(sheetId, vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sheet', sheetId] })
      qc.invalidateQueries({ queryKey: ['evaluations', sheetId] })
      qc.invalidateQueries({ queryKey: ['scores', sheetId] })
    },
  })
}
