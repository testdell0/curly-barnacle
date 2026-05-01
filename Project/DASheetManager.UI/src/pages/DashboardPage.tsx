import { FileText, CheckCircle, LayoutTemplate, Users, TrendingUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStats, useRecentSheets } from '@/hooks/useDashboard'
import { useAuthStore } from '@/store/authStore'
import { ApiError } from '@/api/client'
import type { RecentSheet } from '@/types/da-types'

// ── Stat Card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">
          {value === undefined ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : value}
        </div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────

const statusStyles: Record<RecentSheet['status'], string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Final: 'bg-green-100 text-green-700',
}

function StatusBadge({ status }: { status: RecentSheet['status'] }) {
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', statusStyles[status])}>
      {status}
    </span>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recent, isLoading: recentLoading, error: recentError } = useRecentSheets()

  const isAdmin = user?.role === 'Admin'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.fullName?.split(' ')[0] ?? 'User'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 mb-8 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {/* <div className={cn('grid gap-4 mb-8', isAdmin ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 md:grid-cols-3')}> */}
        <StatCard
          label="Total Sheets"
          value={statsLoading ? undefined : stats?.totalSheets}
          icon={<FileText className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Draft"
          value={statsLoading ? undefined : stats?.draftSheets}
          icon={<TrendingUp className="w-6 h-6 text-gray-500" />}
          color="bg-gray-50"
        />
        <StatCard
          label="Final"
          value={statsLoading ? undefined : stats?.finalSheets}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
        />
        {isAdmin && (
          <>
            <StatCard
              label="Templates"
              value={statsLoading ? undefined : stats?.totalTemplates}
              icon={<LayoutTemplate className="w-6 h-6 text-purple-600" />}
              color="bg-purple-50"
            />
            <StatCard
              label="Users"
              value={statsLoading ? undefined : stats?.totalUsers}
              icon={<Users className="w-6 h-6 text-rose-600" />}
              color="bg-rose-50"
            />
          </>
        )}
      </div>

      {/* Recent Sheets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent DA Sheets</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {recentLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading recent sheets…
            </div>
          )}

          {/* {!recentLoading && (!recent || recent.length === 0 || recentError) && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              No sheets available.
            </div>
          )} */}

          {/* {recentError && (
            <div className="p-4 text-sm text-red-600 bg-red-50">
              No sheets available.
            </div>
          )} */}

          {/* {recentError && (
            <div className="p-4 text-sm text-red-600 bg-red-50">
              Failed to load sheets: {recentError instanceof ApiError ? recentError.message : 'Unknown error'}
            </div>
          )} */}

          {!recentLoading && !recentError && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Template</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Creator</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!recent || recent.length === 0) && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-gray-400">
                      No DA sheets yet.
                    </td>
                  </tr>
                )}
                {recent?.map((sheet) => (
                  <tr key={sheet.sheetId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{sheet.name}</div>
                      <div className="text-xs text-gray-400">{sheet.daType} · v{sheet.version}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sheet.templateName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sheet.status as RecentSheet['status']} />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-gray-600">{sheet.creatorName}</td>
                    )}
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(sheet.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
