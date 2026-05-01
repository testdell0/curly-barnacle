import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sheetsApi } from '@/api/sheets'
import type { CreateSheetRequest, SheetSearchParams } from '@/types/da-types'

const SHEETS_KEY = ['sheets'] as const

export function useSheets(params: SheetSearchParams) {
  return useQuery({
    queryKey: [...SHEETS_KEY, params],
    queryFn: () => sheetsApi.search(params),
    placeholderData: (prev) => prev,
  })
}

export function useSheet(id: number | undefined) {
  return useQuery({
    queryKey: ['sheet', id],
    queryFn: () => sheetsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSheetRequest) => sheetsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHEETS_KEY }),
  })
}

export function useUpdateSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { name: string; notes?: string } }) =>
      sheetsApi.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: SHEETS_KEY })
      qc.invalidateQueries({ queryKey: ['sheet', id] })
    },
  })
}

export function useDeleteSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sheetsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHEETS_KEY }),
  })
}

export function useDuplicateSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sheetsApi.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SHEETS_KEY }),
  })
}

export function useFinalizeSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => sheetsApi.finalize(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: SHEETS_KEY })
      qc.invalidateQueries({ queryKey: ['sheet', id] })
    },
  })
}

export function usePublishedTemplates() {
  return useQuery({
    queryKey: ['published-templates'],
    queryFn: () => sheetsApi.publishedTemplates(),
  })
}

export function useTemplateDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['published-template', id],
    queryFn: () => sheetsApi.templateDetail(id!),
    enabled: !!id,
  })
}
