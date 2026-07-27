import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ApiError } from '@/api/client'
import { usePublishedTemplates, useTemplateDetail, useCreateSheet } from '@/hooks/useSheets'
import type { CreateSheetCategoryDraft } from '@/types/da-types'

export function CreateSheetPage() {
  const navigate = useNavigate()
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>()
  const [sheetName, setSheetName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<CreateSheetCategoryDraft[]>([])

  const { data: templates, isLoading: loadingTemplates } = usePublishedTemplates()
  const { data: templateDetail } = useTemplateDetail(selectedTemplateId)
  const createSheet = useCreateSheet()

  // Seed drafts from the selected template. Switching templates discards prior edits.
  useEffect(() => {
    if (!templateDetail) { setDrafts([]); return }
    setDrafts(templateDetail.categories.map((cat) => ({
      sourceCategoryId: cat.categoryId,
      name: cat.name,
      sortOrder: cat.sortOrder,
      parameters: cat.parameters.map((p) => ({
        sourceParamId: p.paramId,
        name: p.name,
        weightage: p.weightage,
        sortOrder: p.sortOrder,
      })),
    })))
  }, [templateDetail])

  function updateParam(catIdx: number, paramIdx: number, patch: Partial<{ name: string; weightage: number }>) {
    setDrafts((prev) => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      parameters: cat.parameters.map((p, pi) => pi !== paramIdx ? p : { ...p, ...patch }),
    }))
  }

  function removeParam(catIdx: number, paramIdx: number) {
    setDrafts((prev) => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      parameters: cat.parameters.filter((_, pi) => pi !== paramIdx),
    }))
  }

  function addParam(catIdx: number) {
    setDrafts((prev) => prev.map((cat, ci) => ci !== catIdx ? cat : {
      ...cat,
      parameters: [
        ...cat.parameters,
        { sourceParamId: undefined, name: '', weightage: 0, sortOrder: cat.parameters.length },
      ],
    }))
  }

  async function handleCreate() {
    if (!selectedTemplateId || !sheetName.trim()) {
      setError('Please select a template and enter a sheet name.')
      return
    }
    if (!templateDetail) return

    // Client-side sanity checks matching the backend
    for (const cat of drafts) {
      if (!cat.name.trim()) { setError('Every category needs a name.'); return }
      for (const p of cat.parameters) {
        if (!p.name.trim()) { setError(`Parameter name is required in "${cat.name}".`); return }
        if (p.weightage < 0) { setError(`Weightage cannot be negative in "${cat.name}".`); return }
      }
    }

    setError(null)
    try {
      const sheet = await createSheet.mutateAsync({
        name: sheetName.trim(),
        sourceTemplateId: selectedTemplateId,
        categories: drafts,
      })
      navigate(`/sheets/${sheet.sheetId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create sheet.')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/sheets')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Create DA Sheet</h1>
      </div>

      {/* Sheet Name */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sheet Name</label>
        <input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Q1 2026 SaaS Vendor Evaluation"
        />
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Choose Template
        </h2>
        {loadingTemplates ? (
          <div className="text-center py-8 text-gray-500">Loading templates...</div>
        ) : !templates?.length ? (
          <div className="text-center py-8 text-gray-500">
            No published templates available. Ask an admin to publish a template first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.templateId}
                type="button"
                onClick={() => setSelectedTemplateId(t.templateId)}
                className={cn(
                  'text-left p-4 border rounded-xl transition-all',
                  selectedTemplateId === t.templateId
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-800'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t.name}</span>
                  {selectedTemplateId === t.templateId && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1 block">{t.daType}</span>
                {t.description && (
                  <span className="text-xs text-gray-400 mt-1 block line-clamp-2">
                    {t.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customizable Template Preview */}
      {templateDetail && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Customize Parameters — {templateDetail.name}
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Rename, adjust weightage, add or remove parameters before creating the sheet. The source template is not modified.
          </p>

          <div className="space-y-5">
            {drafts.map((cat, catIdx) => {
              const catTotal = cat.parameters.reduce((s, p) => s + (Number(p.weightage) || 0), 0)
              return (
                <div
                  key={cat.sourceCategoryId ?? `new-${catIdx}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{cat.name}</h3>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {catTotal}% total
                    </span>
                  </div>

                  <div className="space-y-2">
                    {cat.parameters.map((p, paramIdx) => (
                      <div key={p.sourceParamId ?? `new-${paramIdx}`} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => updateParam(catIdx, paramIdx, { name: e.target.value })}
                          placeholder="Parameter name"
                          className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={p.weightage}
                            min={0}
                            onChange={(e) => updateParam(catIdx, paramIdx, { weightage: Number(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-md text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-400 w-4">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeParam(catIdx, paramIdx)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove parameter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addParam(catIdx)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add parameter
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={createSheet.isPending || !selectedTemplateId || !sheetName.trim()}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {createSheet.isPending ? 'Creating...' : 'Create Sheet'}
        </button>
        <button
          onClick={() => navigate('/sheets')}
          className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
