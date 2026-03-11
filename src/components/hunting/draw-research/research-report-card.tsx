'use client'

import { useState } from 'react'
import { FileText, Trash2, ChevronRight, Share2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DrawResearchReport } from './types'

const STATUS_STYLES = {
  draft: 'bg-surface text-muted border-subtle',
  final: 'bg-green-950/30 text-green-400 border-green-500/20',
  shared: 'bg-accent/10 text-accent border-accent/20',
}

const STATUS_LABELS = {
  draft: 'Draft',
  final: 'Final',
  shared: 'Shared',
}

export function ResearchReportCard({
  report,
  onOpen,
  onDelete,
}: {
  report: DrawResearchReport
  onOpen: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const recs = report.recommendations ?? []
  const topUnit = recs.length > 0 ? recs[0] : null
  const date = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="border border-subtle rounded-lg bg-elevated hover:border-default transition-colors">
      <button onClick={onOpen} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <FileText className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-primary truncate">{report.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted">{date}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-secondary border border-subtle">
                  {report.state}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-secondary border border-subtle">
                  {report.species.replace(/_/g, ' ')}
                </span>
                <span className={cn('text-xs px-1.5 py-0.5 rounded border', STATUS_STYLES[report.status])}>
                  {STATUS_LABELS[report.status]}
                </span>
              </div>
              {topUnit && (
                <p className="text-xs text-muted mt-1">
                  Top unit: <span className="text-secondary">Unit {topUnit.unitNumber}</span>
                  {' · '}{recs.length} units recommended
                </p>
              )}
              {report.sharedWith.length > 0 && (
                <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                  <Share2 className="h-3 w-3" /> Shared with {report.sharedWith.length} friend{report.sharedWith.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-1" />
        </div>
      </button>

      {/* Delete */}
      <div className="px-4 pb-3 flex justify-end">
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-secondary">Delete this report?</span>
            <button onClick={onDelete} className="text-red-400 hover:text-red-300 font-medium p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">Yes</button>
            <button onClick={() => setConfirmDelete(false)} className="text-muted hover:text-secondary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">No</button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="text-muted hover:text-red-400 transition-colors p-1"
            aria-label="Delete report"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export function SharedReportCard({
  report,
  ownerName,
  onOpen,
}: {
  report: DrawResearchReport
  ownerName?: string
  onOpen: () => void
}) {
  const date = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <button
      onClick={onOpen}
      className="w-full text-left border border-subtle rounded-lg bg-surface/50 hover:border-default transition-colors p-4"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-primary truncate">{report.title}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted">{date}</span>
            {ownerName && <span className="text-xs text-muted">by {ownerName}</span>}
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-secondary border border-subtle">
              {report.state} {report.species.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-1" />
      </div>
    </button>
  )
}
