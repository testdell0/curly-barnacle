import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { evaluationsApi } from '@/api/evaluations'
import type { BulkSaveEvaluationsRequest } from '@/types/da-types'

export function useEvaluations(sheetId: number | undefined) {
  return useQuery({
    queryKey: ['evaluations', sheetId],
    queryFn: () => evaluationsApi.getAll(sheetId!),
    enabled: !!sheetId,
  })
}

export function useBulkSaveEvaluations(sheetId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: BulkSaveEvaluationsRequest) => evaluationsApi.bulkSave(sheetId, body),
    onSuccess: () => {
      // scores are invalidated here; evaluations are explicitly refetched by the caller
      qc.invalidateQueries({ queryKey: ['scores', sheetId] })
    },
  })
}

export function useScores(sheetId: number | undefined) {
  return useQuery({
    queryKey: ['scores', sheetId],
    queryFn: () => evaluationsApi.scores(sheetId!),
    enabled: !!sheetId,
  })
}
