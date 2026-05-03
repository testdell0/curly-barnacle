import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Copy, Trash2, Eye, Pencil, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSheets, useDeleteSheet, useDuplicateSheet } from '@/hooks/useSheets'
import { useAuthStore } from '@/store/authStore'
import type { SheetSearchParams } from '@/types/da-types'

type TabType = 'mine' | 'shared'

export function SheetsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<TabType>('mine')
  const [params, setParams] = useState<SheetSearchParams>({
    page: 1,
    pageSize: 10,
  })
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const queryParams: SheetSearchParams = {
    ...params,
    sharedOnly: activeTab === 'shared',
  }

  const { data, isLoading } = useSheets(queryParams)
  const deleteSheet = useDeleteSheet()
  const duplicateSheet = useDuplicateSheet()

  function handleTabChange(tab: TabType) {
    setActiveTab(tab)
    setParams((p) => ({ ...p, page: 1 }))
  }

  function handleDelete(id: number, name: string) {
    setDeleteTarget({ id, name })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const { id, name } = deleteTarget
    setDeleteTarget(null)
    deleteSheet.mutate(id, {
      onSuccess: () => toast.success(`Sheet "${name}" deleted.`),
      onError: () => toast.error('Failed to delete sheet.'),
    })
  }

  function handleDuplicate(id: number, name: string) {
    duplicateSheet.mutate(id, {
      onSuccess: () => toast.success(`Sheet "${name}" duplicated.`),
      onError: () => toast.error('Failed to duplicate sheet.'),
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">DA Sheets</h1>
          <p className="text-sm text-gray-500 mt-1">Decision analysis sheets for vendor evaluation</p>
        </div>
        {activeTab === 'mine' && (
          <Link
            to="/sheets/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Sheet
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleTabChange('mine')}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTab === 'mine'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          My Sheets
        </button>
        <button
          onClick={() => handleTabChange('shared')}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTab === 'shared'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          Shared with Me
        </button>
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
        <div className="text-center py-12 text-gray-500">
          {activeTab === 'shared' ? 'No sheets have been shared with you.' : 'No sheets found'}
        </div>
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
                {data.items.map((s) => {
                  const isOwner = s.createdBy === currentUser?.userId
                  const isDraft = s.status === 'Draft'
                  return (
                    <tr key={s.sheetId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View (read-only) */}
                          <button
                            onClick={() => navigate(`/sheets/${s.sheetId}?view=1`)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View (read-only)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit (only for Draft sheets the user owns) */}
                          {isOwner && isDraft && (
                            <button
                              onClick={() => navigate(`/sheets/${s.sheetId}`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {/* Share */}
                          {isOwner && (
                            <button
                              onClick={() => navigate(`/sheets/${s.sheetId}?share=1`)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Duplicate */}
                          {isOwner && (
                            <button
                              onClick={() => handleDuplicate(s.sheetId, s.name)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(s.sheetId, s.name)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────

function ConfirmDeleteModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Delete Sheet</h3>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-medium text-gray-900">"{name}"</span>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
