import { useState, useEffect, useMemo, Fragment } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Save,
  CheckCircle2,
  Download,
  Share2,
  History,
  X,
  Trophy,
  ChevronDown,
  ChevronRight,
  Pencil,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSheet, useFinalizeSheet, useUpdateSheet, useDuplicateSheet } from '@/hooks/useSheets'
import { useAddVendor, useDeleteVendor } from '@/hooks/useVendors'
import { useEvaluations, useBulkSaveEvaluations, useScores } from '@/hooks/useEvaluations'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/api/client'
import type {
  EvaluationEntry,
  EvaluationDto,
  SharedAccessDto,
  AuditLogDto,
  CreateShareRequest,
} from '@/types/da-types'

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i) // 0-10

export function SheetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sheetId = Number(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isViewOnly = searchParams.get('view') === '1'
  const autoOpenShare = searchParams.get('share') === '1'
  const backTo = searchParams.get('from') === 'dashboard' ? '/' : '/sheets'

  const currentUser = useAuthStore((s) => s.user)

  const { data: sheet, isLoading } = useSheet(sheetId)
  const { data: evaluations, refetch: refetchEvaluations } = useEvaluations(sheetId)
  const { data: scores } = useScores(sheetId)
  const addVendor = useAddVendor(sheetId)
  const deleteVendor = useDeleteVendor(sheetId)
  const bulkSave = useBulkSaveEvaluations(sheetId)
  const finalizeSheet = useFinalizeSheet()
  const updateSheet = useUpdateSheet()
  const duplicateSheet = useDuplicateSheet()

  const [showAddVendor, setShowAddVendor] = useState(false)
  const [vendorName, setVendorName] = useState('')
  const [localScores, setLocalScores] = useState<Record<string, { score?: number; comment?: string }>>({})
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [removeVendorTarget, setRemoveVendorTarget] = useState<{ vendorId: number; name: string } | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')

  // Auto-open share modal when navigated with ?share=1
  useEffect(() => {
    if (autoOpenShare && sheet) setShowShareModal(true)
  }, [autoOpenShare, sheet])

  // Build a lookup from evaluations
  const evalMap = useMemo(() => {
    const map: Record<string, EvaluationDto> = {}
    evaluations?.forEach((e) => {
      map[`${e.vendorId}-${e.sheetParamId}`] = e
    })
    return map
  }, [evaluations])

  const isDraft = !isViewOnly && sheet?.status === 'Draft'
  const isSharedViewer = isViewOnly && !!currentUser && !!sheet && sheet.createdBy !== currentUser.userId
  const winner = scores?.find((s) => s.isWinner)

  async function handleRename() {
    if (!nameValue.trim() || nameValue.trim() === sheet?.name) {
      setEditingName(false)
      return
    }
    try {
      await updateSheet.mutateAsync({ id: sheetId, body: { name: nameValue.trim() } })
      setEditingName(false)
      toast.success('Sheet renamed.')
    } catch {
      toast.error('Failed to rename sheet.')
    }
  }

  async function handleDuplicateForSelf() {
    try {
      const newSheet = await duplicateSheet.mutateAsync(sheetId)
      toast.success('Sheet duplicated to your account.')
      navigate(`/sheets/${newSheet.sheetId}`)
    } catch {
      toast.error('Failed to duplicate sheet.')
    }
  }

  function getScore(vendorId: number, paramId: number): number | undefined {
    const key = `${vendorId}-${paramId}`
    if (key in localScores) return localScores[key].score   // may be undefined (user cleared)
    return evalMap[key]?.evalScore ?? undefined              // convert null → undefined
  }

  function getComment(vendorId: number, paramId: number): string {
    const key = `${vendorId}-${paramId}`
    if (localScores[key]?.comment !== undefined) return localScores[key].comment!
    return evalMap[key]?.vendorComment ?? ''
  }

  function setScore(vendorId: number, paramId: number, score: number | undefined) {
    const key = `${vendorId}-${paramId}`
    setLocalScores((prev) => ({ ...prev, [key]: { ...prev[key], score } }))
  }

  function setComment(vendorId: number, paramId: number, comment: string) {
    const key = `${vendorId}-${paramId}`
    setLocalScores((prev) => ({ ...prev, [key]: { ...prev[key], comment } }))
  }

  async function handleSaveEvaluations() {
    if (!sheet) return
    const entries: EvaluationEntry[] = []

    for (const vendor of sheet.vendors) {
      for (const cat of sheet.categories) {
        for (const param of cat.parameters) {
          const score = getScore(vendor.vendorId, param.sheetParamId)
          const comment = getComment(vendor.vendorId, param.sheetParamId)
          entries.push({
            vendorId: vendor.vendorId,
            sheetParamId: param.sheetParamId,
            evalScore: score ?? null,
            vendorComment: comment || null,
          })
        }
      }
    }

    await bulkSave.mutateAsync({ evaluations: entries })
    await refetchEvaluations()
    setLocalScores({})
    setSaveMsg('Evaluations saved successfully!')
    setTimeout(() => setSaveMsg(null), 3000)
  }

  function handleAddVendor() {
    if (!vendorName.trim()) return
    addVendor.mutate({ name: vendorName.trim() })
    setVendorName('')
    setShowAddVendor(false)
  }

  function handleFinalize() {
    if (!confirm('Finalize this sheet? Once finalized, it will be marked as Final.')) return
    finalizeSheet.mutate(sheetId)
  }

  async function handleExport() {
    const blob = await api.download(`/api/sheets/${sheetId}/export/pdf`)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `da-sheet-${sheetId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading sheet...</div>
  if (!sheet) return <div className="p-6 text-center text-gray-500">Sheet not found</div>

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backTo)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {editingName ? (
                <>
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    autoFocus
                    className="text-xl font-semibold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent w-72"
                  />
                  <button
                    onClick={handleRename}
                    disabled={updateSheet.isPending}
                    className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-gray-900">{sheet.name}</h1>
                  {isDraft && (
                    <button
                      onClick={() => { setNameValue(sheet.name); setEditingName(true) }}
                      className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                      title="Rename sheet"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{sheet.daType}</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">Template: {sheet.sourceTemplateName}</span>
              <span className="text-xs text-gray-300">|</span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  sheet.status === 'Final'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700',
                )}
              >
                {sheet.status} v{sheet.version}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <button
                onClick={handleSaveEvaluations}
                disabled={bulkSave.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {bulkSave.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleFinalize}
                disabled={finalizeSheet.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalize
              </button>
            </>
          )}
          {isSharedViewer && sheet.status === 'Draft' && (
            <button
              onClick={handleDuplicateForSelf}
              disabled={duplicateSheet.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Copy this sheet to your account to edit"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
          )}
          {!isViewOnly && (
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Save notification */}
      {saveMsg && (
        <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          {saveMsg}
        </div>
      )}

      {/* Winner banner */}
      {winner && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-500" />
          <div>
            <div className="font-semibold text-amber-800">Top Recommendation</div>
            <div className="text-sm text-amber-700">
              {winner.vendorName} — Overall Score: {winner.overallScore.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor (right-aligned, appears on click) */}
      {isDraft && (
        <div className="flex justify-end mb-4">
          {showAddVendor ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddVendor()
                  if (e.key === 'Escape') { setShowAddVendor(false); setVendorName('') }
                }}
                autoFocus
                placeholder="Vendor name..."
                className="w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddVendor}
                disabled={addVendor.isPending || !vendorName.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddVendor(false); setVendorName('') }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddVendor(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          )}
        </div>
      )}

      {/* Evaluation Matrix — always visible; vendor columns appear once vendors are added */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '5%' }} />
            {sheet.vendors.length === 0 ? (
              <>
                <col style={{ width: '56%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
              </>
            ) : (
              sheet.vendors.map((v) => (
                <Fragment key={v.vendorId}>
                  <col style={{ width: `${56 / sheet.vendors.length}%` }} />
                  <col style={{ width: `${12 / sheet.vendors.length}%` }} />
                  <col style={{ width: `${12 / sheet.vendors.length}%` }} />
                </Fragment>
              ))
            )}
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th
                rowSpan={sheet.vendors.length > 0 ? 2 : undefined}
                className="text-left px-3 py-2 font-medium text-gray-600 border border-gray-200"
              >
                Parameter
              </th>
              <th
                rowSpan={sheet.vendors.length > 0 ? 2 : undefined}
                className="text-center px-3 py-2 font-medium text-gray-600 border border-gray-200"
              >
                Wt.
              </th>
              {sheet.vendors.length === 0 ? (
                <th
                  colSpan={3}
                  className="border border-gray-200 bg-white text-gray-400 px-4 py-3 text-center text-sm font-normal italic"
                >
                  Add a vendor to evaluate
                </th>
              ) : (
                sheet.vendors.map((v) => {
                  const vendorScore = scores?.find((s) => s.vendorId === v.vendorId)
                  return (
                    <th
                      key={v.vendorId}
                      colSpan={3}
                      className={cn(
                        'text-center px-3 py-2 font-medium border border-gray-200',
                        vendorScore?.isWinner ? 'bg-amber-50 text-amber-800' : 'text-gray-600',
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{v.name}</span>
                        {vendorScore?.isWinner && <Trophy className="w-3 h-3 text-amber-500" />}
                        {isDraft && (
                          <button
                            onClick={() => setRemoveVendorTarget({ vendorId: v.vendorId, name: v.name })}
                            className="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })
              )}
            </tr>
            {sheet.vendors.length > 0 && (
              <tr className="bg-gray-50">
                {sheet.vendors.map((v) => (
                  <Fragment key={v.vendorId}>
                    <th className="text-center px-2 py-1 text-xs font-normal text-gray-400 border border-gray-200 italic">
                      Comment
                    </th>
                    <th className="text-center px-2 py-1 text-xs font-normal text-gray-400 border border-gray-200 italic">
                      Eval
                    </th>
                    <th className="text-center px-2 py-1 text-xs font-normal text-gray-400 border border-gray-200 italic">
                      Result
                    </th>
                  </Fragment>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {sheet.categories.map((cat) => (
              <CatBlock
                key={cat.sheetCategoryId}
                cat={cat}
                vendors={sheet.vendors}
                isDraft={isDraft}
                getScore={getScore}
                getComment={getComment}
                setScore={setScore}
                setComment={setComment}
              />
            ))}
            {/* Overall score row — live calculated */}
            {sheet.vendors.length > 0 && (
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="px-3 py-2 text-gray-900 border border-gray-200 text-right text-xs uppercase tracking-wide">
                  Overall Score
                </td>
                {sheet.vendors.map((v) => {
                  const liveTotal = sheet.categories.reduce((catSum, cat) =>
                    catSum + cat.parameters.reduce((pSum, param) => {
                      const s = getScore(v.vendorId, param.sheetParamId)
                      return pSum + (s !== undefined ? s * param.weightage : 0)
                    }, 0), 0)
                  const savedScore = scores?.find((s) => s.vendorId === v.vendorId)
                  return (
                    <Fragment key={v.vendorId}>
                      <td colSpan={2} className="border border-gray-200 bg-gray-100" />
                      <td
                        className={cn(
                          'px-3 py-2 text-center border border-gray-200',
                          savedScore?.isWinner ? 'bg-amber-100 text-amber-900' : '',
                        )}
                      >
                        {liveTotal.toFixed(2)}
                      </td>
                    </Fragment>
                  )
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* History Section (collapsible) */}
      <div className="mt-8 border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <History className="w-4 h-4" />
          History
        </button>
        {showHistory && <HistorySection sheetId={sheetId} />}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          sheetId={sheetId}
          shares={sheet.sharedWith}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Remove Vendor Modal */}
      {removeVendorTarget && (
        <ConfirmModal
          title="Remove Vendor"
          message={`Remove "${removeVendorTarget.name}" and all their evaluation scores?`}
          confirmLabel="Remove"
          onConfirm={() => {
            deleteVendor.mutate(removeVendorTarget.vendorId)
            setRemoveVendorTarget(null)
          }}
          onCancel={() => setRemoveVendorTarget(null)}
        />
      )}
    </div>
  )
}

// ── Category Block (with live subtotals) ─────────────────────────────────

function CatBlock({
  cat,
  vendors,
  isDraft,
  getScore,
  getComment,
  setScore,
  setComment,
}: {
  cat: { sheetCategoryId: number; name: string; parameters: { sheetParamId: number; name: string; weightage: number }[] }
  vendors: { vendorId: number; name: string }[]
  isDraft: boolean
  getScore: (vid: number, pid: number) => number | undefined
  getComment: (vid: number, pid: number) => string
  setScore: (vid: number, pid: number, s: number | undefined) => void
  setComment: (vid: number, pid: number, c: string) => void
}) {
  const colSpan = vendors.length === 0 ? 5 : 2 + vendors.length * 3
  return (
    <>
      {/* Category header */}
      <tr>
        <td
          colSpan={colSpan}
          className="px-3 py-2 bg-blue-50 font-semibold text-blue-800 text-xs uppercase tracking-wide border border-gray-200"
        >
          {cat.name}
        </td>
      </tr>
      {/* Param rows */}
      {cat.parameters.map((param) => (
        <ParamRow
          key={param.sheetParamId}
          param={param}
          vendors={vendors}
          isDraft={isDraft}
          getScore={getScore}
          getComment={getComment}
          setScore={setScore}
          setComment={setComment}
        />
      ))}
      {/* Category subtotal — live */}
      {vendors.length > 0 && (
        <tr className="bg-gray-50 font-medium">
          <td colSpan={2} className="px-3 py-2 text-gray-700 border border-gray-200 text-right text-xs uppercase tracking-wide">
            {cat.name} Subtotal
          </td>
          {vendors.map((v) => {
            const subtotal = cat.parameters.reduce((sum, param) => {
              const s = getScore(v.vendorId, param.sheetParamId)
              return sum + (s !== undefined ? s * param.weightage : 0)
            }, 0)
            return (
              <Fragment key={v.vendorId}>
                <td colSpan={2} className="border border-gray-200 bg-gray-50" />
                <td className="px-3 py-2 text-center border border-gray-200 text-xs font-semibold">
                  {subtotal.toFixed(2)}
                </td>
              </Fragment>
            )
          })}
        </tr>
      )}
    </>
  )
}

// ── Parameter Row (comment always visible, then score) ───────────────────

function ParamRow({
  param,
  vendors,
  isDraft,
  getScore,
  getComment,
  setScore,
  setComment,
}: {
  param: { sheetParamId: number; name: string; weightage: number }
  vendors: { vendorId: number; name: string }[]
  isDraft: boolean
  getScore: (vid: number, pid: number) => number | undefined
  getComment: (vid: number, pid: number) => string
  setScore: (vid: number, pid: number, s: number | undefined) => void
  setComment: (vid: number, pid: number, c: string) => void
}) {
  return (
    <tr className="hover:bg-gray-50 align-top">
      <td className="px-3 py-2 text-gray-700 border border-gray-200">{param.name}</td>
      <td className="px-3 py-2 text-center text-gray-500 border border-gray-200 whitespace-nowrap">{param.weightage}%</td>
      {vendors.length === 0 ? (
        <td colSpan={3} className="border border-gray-200 bg-white" />
      ) : (
        vendors.map((v) => {
          const score = getScore(v.vendorId, param.sheetParamId)
          const comment = getComment(v.vendorId, param.sheetParamId)
          const result = score !== undefined ? score * param.weightage : undefined

          return (
            <Fragment key={v.vendorId}>
              {/* Comment */}
              <td className="px-2 py-2 border border-gray-200">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(v.vendorId, param.sheetParamId, e.target.value)}
                  disabled={!isDraft}
                  placeholder="Remarks..."
                  rows={2}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </td>
              {/* Eval */}
              <td className="px-2 py-2 border border-gray-200 align-middle">
                <select
                  value={score ?? ''}
                  onChange={(e) =>
                    setScore(v.vendorId, param.sheetParamId,
                      e.target.value === '' ? undefined : Number(e.target.value))
                  }
                  disabled={!isDraft}
                  className="w-full px-1 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="">-</option>
                  {SCORE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              {/* Result */}
              <td className="px-2 py-2 border border-gray-200 text-center text-xs font-medium text-gray-700">
                {result !== undefined ? result.toFixed(0) : ''}
              </td>
            </Fragment>
          )
        })
      )}
    </tr>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600">{message}</p>
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
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Share Modal ───────────────────────────────────────────────────────────

function ShareModal({
  sheetId,
  shares,
  onClose,
}: {
  sheetId: number
  shares: SharedAccessDto[]
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [localShares, setLocalShares] = useState<SharedAccessDto[]>(shares)

  async function handleShare() {
    if (!email.trim()) return
    setBusy(true)
    try {
      const res = await api.post<{ success: boolean; share: SharedAccessDto }>(
        `/api/sheets/${sheetId}/shares`,
        { email: email.trim(), accessLevel: 'view' } as CreateShareRequest,
      )
      setLocalShares((prev) => [...prev, res.share])
      setEmail('')
    } catch { /* ignore */ }
    setBusy(false)
  }

  async function handleRemoveShare(shareId: number) {
    await api.delete<{ success: boolean }>(`/api/sheets/${sheetId}/shares/${shareId}`)
    setLocalShares((prev) => prev.filter((s) => s.shareId !== shareId))
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Share Sheet</h3>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="User email..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleShare}
              disabled={busy || !email.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Share
            </button>
          </div>

          {localShares.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Shared With</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {localShares.map((s) => (
                  <li key={s.shareId} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-900">{s.sharedWithName ?? s.sharedWithEmail}</span>
                      <span className="ml-2 text-xs text-gray-400 capitalize">{s.accessLevel}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(s.shareId)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── History Section ──────────────────────────────────────────────────────

function HistorySection({ sheetId }: { sheetId: number }) {
  const [logs, setLogs] = useState<AuditLogDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<AuditLogDto[]>(`/api/sheets/${sheetId}/history`).then((data) => {
      setLogs(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [sheetId])

  if (loading || !logs.length) return null

  return (
    <div className="mt-3 divide-y divide-gray-100">
      {logs.map((log) => (
        <div key={log.logId} className="flex items-start gap-4 py-2.5 pl-3 border-l-2 border-blue-200">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-800">{log.action}</span>
              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                {new Date(log.changedAt).toLocaleString()}
              </span>
            </div>
            {log.summary && <p className="text-xs text-gray-500 mt-0.5">{log.summary}</p>}
            <span className="text-xs text-gray-400">{log.changedByName}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
