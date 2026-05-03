import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSheet, useFinalizeSheet } from '@/hooks/useSheets'
import { useAddVendor, useDeleteVendor } from '@/hooks/useVendors'
import { useEvaluations, useBulkSaveEvaluations, useScores } from '@/hooks/useEvaluations'
import { api } from '@/api/client'
import type {
  EvaluationEntry,
  EvaluationDto,
  VendorScoreSummary,
  SharedAccessDto,
  AuditLogDto,
  CreateShareRequest,
} from '@/types/da-types'

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, i) => i) // 0-10

export function SheetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const sheetId = Number(id)
  const navigate = useNavigate()

  const { data: sheet, isLoading } = useSheet(sheetId)
  const { data: evaluations, refetch: refetchEvaluations } = useEvaluations(sheetId)
  const { data: scores } = useScores(sheetId)
  const addVendor = useAddVendor(sheetId)
  const deleteVendor = useDeleteVendor(sheetId)
  const bulkSave = useBulkSaveEvaluations(sheetId)
  const finalizeSheet = useFinalizeSheet()

  const [showAddVendor, setShowAddVendor] = useState(false)
  const [vendorName, setVendorName] = useState('')
  const [localScores, setLocalScores] = useState<Record<string, { score?: number; comment?: string }>>({})
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Build a lookup from evaluations
  const evalMap = useMemo(() => {
    const map: Record<string, EvaluationDto> = {}
    evaluations?.forEach((e) => {
      map[`${e.vendorId}-${e.sheetParamId}`] = e
    })
    return map
  }, [evaluations])

  const isDraft = sheet?.status === 'Draft'
  const winner = scores?.find((s) => s.isWinner)

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
            onClick={() => navigate('/sheets')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{sheet.name}</h1>
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
          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
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

      {/* Evaluation Matrix + Scores (single view) */}
      {!sheet.vendors.length ? (
        <div className="text-center py-12 text-gray-500">Add vendors to start evaluating</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-medium text-gray-600 border border-gray-200 min-w-[200px]">
                  Parameter
                </th>
                <th className="text-center px-3 py-2 font-medium text-gray-600 border border-gray-200 w-20">
                  Weight
                </th>
                {sheet.vendors.map((v) => {
                  const vendorScore = scores?.find((s) => s.vendorId === v.vendorId)
                  return (
                    <th
                      key={v.vendorId}
                      className={cn(
                        'text-center px-3 py-2 font-medium border border-gray-200 min-w-[200px]',
                        vendorScore?.isWinner ? 'bg-amber-50 text-amber-800' : 'text-gray-600',
                      )}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{v.name}</span>
                        {vendorScore?.isWinner && <Trophy className="w-3 h-3 text-amber-500" />}
                        {isDraft && (
                          <button
                            onClick={() => { if (confirm('Remove this vendor?')) deleteVendor.mutate(v.vendorId) }}
                            className="p-0.5 rounded text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sheet.categories.map((cat) => {
                return (
                  <CatBlock
                    key={cat.sheetCategoryId}
                    cat={cat}
                    vendors={sheet.vendors}
                    isDraft={isDraft}
                    getScore={getScore}
                    getComment={getComment}
                    setScore={setScore}
                    setComment={setComment}
                    scores={scores}
                  />
                )
              })}
              {/* Overall total */}
              {scores && scores.length > 0 && (
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={2} className="px-3 py-2 text-gray-900 border border-gray-200 text-right">
                    Overall Score
                  </td>
                  {sheet.vendors.map((v) => {
                    const vs = scores?.find((s) => s.vendorId === v.vendorId)
                    return (
                      <td
                        key={v.vendorId}
                        className={cn(
                          'px-3 py-2 text-center border border-gray-200',
                          vs?.isWinner ? 'bg-amber-100 text-amber-900' : '',
                        )}
                      >
                        {vs?.overallScore.toFixed(2) ?? '0.00'}
                      </td>
                    )
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* History Section (collapsible) */}
      <div className="mt-8 border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <History className="w-4 h-4" />
          Audit History
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
    </div>
  )
}

// ── Category Block (with subtotals) ──────────────────────────────────────

function CatBlock({
  cat,
  vendors,
  isDraft,
  getScore,
  getComment,
  setScore,
  setComment,
  scores,
}: {
  cat: { sheetCategoryId: number; name: string; parameters: { sheetParamId: number; name: string; weightage: number }[] }
  vendors: { vendorId: number; name: string }[]
  isDraft: boolean
  getScore: (vid: number, pid: number) => number | undefined
  getComment: (vid: number, pid: number) => string
  setScore: (vid: number, pid: number, s: number | undefined) => void
  setComment: (vid: number, pid: number, c: string) => void
  scores: VendorScoreSummary[] | undefined
}) {
  return (
    <>
      {/* Category header */}
      <tr>
        <td
          colSpan={2 + vendors.length}
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
      {/* Category subtotal */}
      {scores && scores.length > 0 && (
        <tr className="bg-gray-50 font-medium">
          <td colSpan={2} className="px-3 py-2 text-gray-700 border border-gray-200 text-right text-xs">
            {cat.name} Subtotal
          </td>
          {vendors.map((v) => {
            const vCat = scores
              .find((s) => s.vendorId === v.vendorId)
              ?.categoryScores.find((c) => c.sheetCategoryId === cat.sheetCategoryId)
            return (
              <td key={v.vendorId} className="px-3 py-2 text-center border border-gray-200 text-xs">
                {vCat?.subTotal.toFixed(2) ?? '0.00'}
              </td>
            )
          })}
        </tr>
      )}
    </>
  )
}

// ── Parameter Row (score + comment) ──────────────────────────────────────

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
  const [expandedComment, setExpandedComment] = useState<string | null>(null)

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 text-gray-700 border border-gray-200">{param.name}</td>
      <td className="px-3 py-2 text-center text-gray-500 border border-gray-200">{param.weightage}%</td>
      {vendors.map((v) => {
        const score = getScore(v.vendorId, param.sheetParamId)
        const comment = getComment(v.vendorId, param.sheetParamId)
        const result = score !== undefined ? score * param.weightage : 0
        const evalKey = `${v.vendorId}-${param.sheetParamId}`
        const isCommentOpen = expandedComment === evalKey

        return (
          <td key={v.vendorId} className="px-2 py-1.5 border border-gray-200">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <select
                  value={score ?? ''}
                  onChange={(e) =>
                    setScore(v.vendorId, param.sheetParamId,
                      e.target.value === '' ? undefined : Number(e.target.value))
                  }
                  disabled={!isDraft}
                  className="w-14 px-1 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="">-</option>
                  {SCORE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 w-10 text-right">={result.toFixed(0)}</span>
                <button
                  onClick={() => setExpandedComment(isCommentOpen ? null : evalKey)}
                  className={cn(
                    'p-0.5 rounded transition-colors',
                    comment ? 'text-blue-500 hover:text-blue-700' : 'text-gray-300 hover:text-gray-500',
                  )}
                  title="Comment / Remarks"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
              {isCommentOpen && (
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(v.vendorId, param.sheetParamId, e.target.value)}
                  disabled={!isDraft}
                  placeholder="Remarks..."
                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
              )}
            </div>
          </td>
        )
      })}
    </tr>
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
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view')
  const [busy, setBusy] = useState(false)
  const [localShares, setLocalShares] = useState<SharedAccessDto[]>(shares)

  async function handleShare() {
    if (!email.trim()) return
    setBusy(true)
    try {
      const res = await api.post<{ success: boolean; share: SharedAccessDto }>(
        `/api/sheets/${sheetId}/shares`,
        { email: email.trim(), accessLevel } as CreateShareRequest,
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
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as 'view' | 'edit')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
            </select>
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

  if (loading) return <p className="text-sm text-gray-500 mt-3">Loading history...</p>
  if (!logs.length) return <p className="text-sm text-gray-500 mt-3">No audit entries yet.</p>

  return (
    <div className="mt-3 space-y-2 max-w-2xl">
      {logs.map((log) => (
        <div key={log.logId} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
          <History className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">{log.action}</span>
              <span className="text-xs text-gray-400">{new Date(log.changedAt).toLocaleString()}</span>
            </div>
            {log.summary && <p className="text-xs text-gray-500 mt-0.5">{log.summary}</p>}
            <span className="text-xs text-gray-400">{log.changedByName}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
