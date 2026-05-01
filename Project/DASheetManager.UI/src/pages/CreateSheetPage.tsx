import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePublishedTemplates, useTemplateDetail, useCreateSheet } from '@/hooks/useSheets'

export function CreateSheetPage() {
  const navigate = useNavigate()
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>()
  const [sheetName, setSheetName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: templates, isLoading: loadingTemplates } = usePublishedTemplates()
  const { data: templateDetail } = useTemplateDetail(selectedTemplateId)
  const createSheet = useCreateSheet()

  async function handleCreate() {
    if (!selectedTemplateId || !sheetName.trim()) {
      setError('Please select a template and enter a sheet name.')
      return
    }
    if (!templateDetail) return

    setError(null)
    try {
      const sheet = await createSheet.mutateAsync({
        name: sheetName.trim(),
        sourceTemplateId: selectedTemplateId,
        categories: templateDetail.categories.map((c) => ({
          name: c.name,
          sortOrder: c.sortOrder,
          parameters: c.parameters.map((p) => ({
            name: p.name,
            weightage: p.weightage,
            sortOrder: p.sortOrder,
          })),
        })),
      })
      navigate(`/sheets/${sheet.sheetId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sheet')
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
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name</label>
        <input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Q1 2026 SaaS Vendor Evaluation"
        />
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
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
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">{t.name}</span>
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

      {/* Template Preview */}
      {templateDetail && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Template Preview: {templateDetail.name}
          </h2>
          <div className="space-y-3">
            {templateDetail.categories.map((cat) => (
              <div key={cat.categoryId}>
                <h3 className="text-sm font-medium text-gray-800">{cat.name}</h3>
                <ul className="mt-1 space-y-0.5">
                  {cat.parameters.map((p) => (
                    <li
                      key={p.paramId}
                      className="text-xs text-gray-600 flex items-center justify-between max-w-md"
                    >
                      <span>{p.name}</span>
                      <span className="text-gray-400">{p.weightage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
