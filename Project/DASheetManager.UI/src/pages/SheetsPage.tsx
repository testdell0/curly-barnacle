import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Copy, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSheets, useDeleteSheet, useDuplicateSheet } from '@/hooks/useSheets'
import type { SheetSearchParams } from '@/types/da-types'

export function SheetsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<SheetSearchParams>({
    page: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useSheets(params)
  const deleteSheet = useDeleteSheet()
  const duplicateSheet = useDuplicateSheet()

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete sheet "${name}"? This cannot be undone.`)) return
    deleteSheet.mutate(id)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">DA Sheets</h1>
          <p className="text-sm text-gray-500 mt-1">Decision analysis sheets for vendor evaluation</p>
        </div>
        <Link
          to="/sheets/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Sheet
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search sheets..."
          value={params.search ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, search: e.target.value, page: 1 }))}
          className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={params.status ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value || undefined, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Final">Final</option>
        </select>
        <select
          value={params.daType ?? ''}
          onChange={(e) => setParams((p) => ({ ...p, daType: e.target.value || undefined, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="License">License</option>
          <option value="Custom Development">Custom Development</option>
          <option value="SaaS">SaaS</option>
          <option value="Hardware">Hardware</option>
          <option value="Consulting">Consulting</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading sheets...</div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 text-gray-500">No sheets found</div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Template</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <tr
                    key={s.sheetId}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/sheets/${s.sheetId}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.daType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          s.status === 'Final'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700',
                        )}
                      >
                        {s.status} {s.version > 1 && `v${s.version}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.sourceTemplateName}</td>
                    <td className="px-4 py-3 text-gray-600">{s.createdByName}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(s.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/sheets/${s.sheetId}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateSheet.mutate(s.sheetId)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.sheetId, s.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                Page {data.page} of {data.totalPages} ({data.totalCount} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                  disabled={data.page <= 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                  disabled={data.page >= data.totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
