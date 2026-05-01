import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import { useAuthStore } from '@/store/authStore'

export function useDashboardStats() {
  const user = useAuthStore(s => s.user)

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.stats(),
    enabled: !!user,
    staleTime: 60 * 1000,
    retry: false,
  })
}

export function useRecentSheets() {
  const user = useAuthStore(s => s.user)

  return useQuery({
    queryKey: ['dashboard', 'recent-sheets'],
    queryFn: () => dashboardApi.recentSheets(),
    enabled: !!user,
    staleTime: 60 * 1000,
    retry: false,
  })
}
