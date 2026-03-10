'use client'

import { useState, useCallback } from 'react'
import { Plus, ArrowLeft, Share2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'
import { ResearchWizard } from './research-wizard'
import { ResearchResults } from './research-results'
import { ResearchChat } from './research-chat'
import { ResearchReportCard } from './research-report-card'
import type {
  AutoContext, WizardInputs, DrawResearchReport,
  UnitRecommendation, ChatMessage,
} from './types'

type View = 'list' | 'wizard' | 'generating' | 'active'

const PROGRESS_STEPS = [
  'Analyzing your profile…',
  'Checking draw statistics…',
  'Evaluating units…',
  'Building draw strategy…',
  'Generating hunt codes…',
]

export function DrawResearchPage({
  initialReports,
  sharedReports,
  autoContext,
  friends,
}: {
  initialReports: DrawResearchReport[]
  sharedReports: DrawResearchReport[]
  autoContext: AutoContext
  friends: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [view, setView] = useState<View>('list')
  const [reports, setReports] = useState<DrawResearchReport[]>(initialReports)
  const [activeReport, setActiveReport] = useState<DrawResearchReport | null>(null)
  const [generating, setGenerating] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharePickerOpen, setSharePickerOpen] = useState(false)

  // ── Generate new report ──
  async function handleWizardSubmit(inputs: WizardInputs) {
    setView('generating')
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/hunts/unit-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizardInputs: inputs }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error === 'quota_exceeded'
          ? 'Monthly AI query limit reached. Upgrade your plan for more.'
          : data.error ?? 'Failed to generate recommendations')
        setView('wizard')
        return
      }

      const data = await res.json()
      const newReport: DrawResearchReport = {
        id: data.reportId,
        title: data.title,
        state: inputs.state,
        species: inputs.species,
        season: inputs.season,
        wizardInputs: inputs,
        recommendations: data.recommendations ?? [],
        summary: data.summary ?? null,
        chatHistory: [],
        userRankings: null,
        status: 'draft',
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setReports(prev => [newReport, ...prev])
      setActiveReport(newReport)
      setView('active')
    } catch {
      setError('Network error. Please try again.')
      setView('wizard')
    } finally {
      setGenerating(false)
    }
  }

  // ── Open existing report ──
  function openReport(report: DrawResearchReport) {
    setActiveReport(report)
    setView('active')
  }

  // ── Delete report ──
  async function deleteReport(reportId: string) {
    await fetch('/api/hunts/unit-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, rankings: undefined, sharedWith: undefined }),
    }).catch(() => {})

    // Optimistic: Just remove from the client list.
    // We need a DELETE endpoint eventually, but for now rely on DB cascade or manual cleanup.
    setReports(prev => prev.filter(r => r.id !== reportId))
    if (activeReport?.id === reportId) {
      setActiveReport(null)
      setView('list')
    }
  }

  // ── Update rankings ──
  const handleUpdateRankings = useCallback(async (rankings: string[]) => {
    if (!activeReport) return

    setActiveReport(prev => prev ? { ...prev, userRankings: rankings } : null)
    setReports(prev => prev.map(r => r.id === activeReport.id ? { ...r, userRankings: rankings } : r))

    await fetch('/api/hunts/unit-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: activeReport.id, rankings }),
    }).catch(() => {})
  }, [activeReport])

  // ── Chat ──
  async function handleChatSend(message: string, history: ChatMessage[]) {
    if (!activeReport) return
    setChatLoading(true)

    try {
      const res = await fetch('/api/hunts/unit-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: activeReport.id,
          message,
          history: history.slice(-6),
        }),
      })

      if (!res.ok) return

      const data = await res.json()
      const newHistory: ChatMessage[] = [
        ...activeReport.chatHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: data.response },
      ]

      setActiveReport(prev => prev ? { ...prev, chatHistory: newHistory } : null)
      setReports(prev => prev.map(r =>
        r.id === activeReport.id ? { ...r, chatHistory: newHistory } : r
      ))
    } finally {
      setChatLoading(false)
    }
  }

  // ── Share with friends ──
  async function handleShare(friendIds: string[]) {
    if (!activeReport) return

    await fetch('/api/hunts/unit-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: activeReport.id, sharedWith: friendIds }),
    })

    setActiveReport(prev => prev ? { ...prev, sharedWith: friendIds, status: 'shared' } : null)
    setReports(prev => prev.map(r =>
      r.id === activeReport.id ? { ...r, sharedWith: friendIds, status: 'shared' } : r
    ))
    setSharePickerOpen(false)
  }

  // ── Create hunt from recommendation ──
  function handleCreateHunt(rec: UnitRecommendation) {
    const params = new URLSearchParams({
      new: '1',
      state: rec.state,
      species: activeReport?.species ?? '',
      unit: rec.unitNumber,
    })
    router.push(`/hunting/hunts?${params.toString()}`)
  }

  // ── Finalize report ──
  async function handleFinalize() {
    if (!activeReport) return

    setActiveReport(prev => prev ? { ...prev, status: 'final' } : null)
    setReports(prev => prev.map(r =>
      r.id === activeReport.id ? { ...r, status: 'final' } : r
    ))

    await fetch('/api/hunts/unit-scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: activeReport.id,
        rankings: activeReport.userRankings,
      }),
    }).catch(() => {})
  }

  return (
    <div>
      {/* Progress modal */}
      <AIProgressModal
        open={generating}
        featureLabel="Draw Research"
        steps={PROGRESS_STEPS}
      />

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="space-y-4">
          <button
            onClick={() => { setView('wizard'); setError(null) }}
            className="btn-primary font-semibold rounded px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Research
          </button>

          {reports.length === 0 && sharedReports.length === 0 && (
            <div className="text-center py-12 border border-dashed border-subtle rounded-lg">
              <p className="text-secondary text-sm">No draw research yet.</p>
              <p className="text-muted text-xs mt-1">Start a new research to get AI-powered unit recommendations.</p>
            </div>
          )}

          {reports.length > 0 && (
            <div className="space-y-2">
              {reports.map(r => (
                <ResearchReportCard
                  key={r.id}
                  report={r}
                  onOpen={() => openReport(r)}
                  onDelete={() => deleteReport(r.id)}
                />
              ))}
            </div>
          )}

          {sharedReports.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" /> Shared With Me
              </h3>
              {sharedReports.map(r => (
                <ResearchReportCard
                  key={r.id}
                  report={r}
                  onOpen={() => openReport(r)}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WIZARD VIEW ── */}
      {view === 'wizard' && (
        <div>
          {error && (
            <div className="mb-4 p-3 rounded border border-red-500/30 bg-red-950/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <ResearchWizard
            autoContext={autoContext}
            onSubmit={handleWizardSubmit}
            onCancel={() => setView('list')}
          />
        </div>
      )}

      {/* ── ACTIVE REPORT VIEW ── */}
      {view === 'active' && activeReport && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="text-muted hover:text-primary transition-colors p-1"
                aria-label="Back to list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-primary">{activeReport.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSharePickerOpen(true)}
                className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary border border-subtle rounded px-3 py-1.5 transition-colors"
              >
                <Share2 className="h-3 w-3" /> Share
              </button>
              {activeReport.status !== 'final' && (
                <button
                  onClick={handleFinalize}
                  className="flex items-center gap-1.5 text-xs btn-primary rounded px-3 py-1.5 font-medium transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" /> Finalize
                </button>
              )}
              <button
                onClick={() => {
                  setView('wizard')
                  setError(null)
                }}
                className="text-xs text-muted hover:text-secondary transition-colors"
              >
                Re-Scout
              </button>
            </div>
          </div>

          {/* Results */}
          <ResearchResults
            recommendations={activeReport.recommendations}
            summary={activeReport.summary}
            userRankings={activeReport.userRankings}
            onUpdateRankings={handleUpdateRankings}
            onCreateHunt={handleCreateHunt}
          />

          {/* Chat */}
          <ResearchChat
            reportId={activeReport.id}
            initialHistory={activeReport.chatHistory}
            onSend={handleChatSend}
            isLoading={chatLoading}
          />
        </div>
      )}

      {/* ── Share Picker Modal ── */}
      {sharePickerOpen && activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-elevated border border-subtle rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-sm font-semibold text-primary">Share with Friends</h3>
            {friends.length === 0 ? (
              <p className="text-xs text-muted">No friends to share with. Add friends in the Community section.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map(f => {
                  const isSelected = activeReport.sharedWith.includes(f.id)
                  return (
                    <label key={f.id} className="flex items-center gap-2 text-sm text-secondary cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const updated = isSelected
                            ? activeReport.sharedWith.filter(id => id !== f.id)
                            : [...activeReport.sharedWith, f.id]
                          setActiveReport(prev => prev ? { ...prev, sharedWith: updated } : null)
                        }}
                        className="h-4 w-4 rounded border-subtle"
                      />
                      {f.name}
                    </label>
                  )
                })}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSharePickerOpen(false)}
                className="text-xs text-muted hover:text-secondary transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleShare(activeReport.sharedWith)}
                className="text-xs btn-primary rounded px-3 py-1.5 font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
