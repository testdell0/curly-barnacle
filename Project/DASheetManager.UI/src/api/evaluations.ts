import { api } from './client'
import type {
  EvaluationDto,
  BulkSaveEvaluationsRequest,
  VendorScoreSummary,
} from '@/types/da-types'

export const evaluationsApi = {
  getAll: (sheetId: number) =>
    api.get<EvaluationDto[]>(`/api/sheets/${sheetId}/evaluations`),
  bulkSave: (sheetId: number, body: BulkSaveEvaluationsRequest) =>
    api.post<{ success: boolean }>(`/api/sheets/${sheetId}/evaluations/bulk-save`, body),
  scores: (sheetId: number) =>
    api.get<VendorScoreSummary[]>(`/api/sheets/${sheetId}/scores`),
}
