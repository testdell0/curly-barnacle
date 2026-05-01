import { api } from './client'
import type { DashboardStats, RecentSheet } from '@/types/da-types'

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/api/dashboard/stats'),
  recentSheets: () => api.get<RecentSheet[]>('/api/dashboard/recent-sheets'),
}
