'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, ArrowUp, ArrowDown, Copy, Check,
  AlertTriangle, ExternalLink, Fish, MapPin, Tent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnitRecommendation } from './types'

function ScoreBar({ score }: { score: number }) {
  const s = score ?? 0
  const color = s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${s}%` }} />
      </div>
      <span className="text-xs font-semibold text-primary w-7 text-right">{s}</span>
    </div>
  )
}

function HuntCodeBadge({ code, description }: { code: string; description: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2 bg-surface rounded px-2 py-1.5 border border-subtle">
      <code className="text-xs font-mono text-accent flex-1">{code}</code>
      <button onClick={handleCopy} className="text-muted hover:text-primary transition-colors p-1" aria-label="Copy hunt code">
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
      <span className="text-xs text-muted hidden sm:inline">— {description}</span>
    </div>
  )
}

function UnitCard({
  rec,
  displayRank,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onCreateHunt,
}: {
  rec: UnitRecommendation
  displayRank: number
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  onCreateHunt: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Defensive defaults for AI-generated fields that may be missing
  const highlights = rec.highlights ?? []
  const pros = rec.pros ?? []
  const cons = rec.cons ?? []
  const huntCodes = rec.suggestedHuntCodes ?? []
  const drawStrategy = rec.drawStrategy ?? { choicePosition: '1st' as const, reasoning: '', pairedWith: null }

  const difficultyColor = {
    Easy: 'text-green-400',
    Moderate: 'text-amber-400',
    Strenuous: 'text-orange-400',
    Extreme: 'text-red-400',
  }[rec.terrainDifficulty] ?? 'text-secondary'

  return (
    <div className="border border-subtle rounded-lg bg-elevated overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank + reorder */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="text-muted hover:text-primary disabled:opacity-20 transition-colors p-1"
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
              {displayRank}
            </span>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="text-muted hover:text-primary disabled:opacity-20 transition-colors p-1"
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-primary">Unit {rec.unitNumber}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-surface text-secondary border border-subtle">{rec.state}</span>
              <span className={cn('text-xs font-medium', difficultyColor)}>{rec.terrainDifficulty}</span>
            </div>

            <ScoreBar score={rec.score} />

            {/* Key stats */}
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span className="text-secondary">
                Draw odds: <span className="text-primary font-medium">{rec.drawOddsEstimate}</span>
              </span>
              <span className="text-secondary">
                Success: <span className="text-primary font-medium">{rec.successRate}</span>
              </span>
            </div>

            {/* Draw strategy */}
            <div className="mt-2 px-3 py-2 rounded bg-accent/10 border border-accent/20">
              <p className="text-xs text-accent font-medium">
                {drawStrategy.choicePosition === '1st' ? '✦ Recommended as 1st choice' :
                 drawStrategy.choicePosition === '2nd' ? '→ Recommended as 2nd choice' :
                 '→ Recommended as 3rd choice'}
              </p>
              {drawStrategy.reasoning && (
                <p className="text-xs text-secondary mt-0.5">{drawStrategy.reasoning}</p>
              )}
              {drawStrategy.pairedWith && (
                <p className="text-xs text-muted mt-0.5">{drawStrategy.pairedWith}</p>
              )}
            </div>

            {/* Highlights */}
            <ul className="mt-2 space-y-0.5">
              {highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="text-xs text-secondary flex items-start gap-1.5">
                  <span className="text-accent mt-0.5">•</span> {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Expandable section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 py-2 border-t border-subtle text-xs text-muted hover:text-secondary transition-colors"
      >
        {expanded ? 'Less' : 'Hunt codes, pros/cons & more'}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-subtle">
          {/* Hunt Codes */}
          {huntCodes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">Suggested Hunt Codes</p>
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> Verify at state portal
                </span>
              </div>
              <div className="space-y-1.5">
                {huntCodes.map((hc, i) => (
                  <HuntCodeBadge key={i} code={hc.code} description={hc.description} />
                ))}
              </div>
            </div>
          )}

          {/* Pros / Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pros.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-400 uppercase tracking-wide mb-1">Pros</p>
                <ul className="space-y-0.5">
                  {pros.map((p, i) => (
                    <li key={i} className="text-xs text-secondary">+ {p}</li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-1">Cons</p>
                <ul className="space-y-0.5">
                  {cons.map((c, i) => (
                    <li key={i} className="text-xs text-secondary">– {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Fishing + Amenities */}
          {rec.fishingNotes && (
            <div className="flex items-start gap-2 text-xs text-secondary">
              <Fish className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
              <span>{rec.fishingNotes}</span>
            </div>
          )}
          {rec.amenityNotes && (
            <div className="flex items-start gap-2 text-xs text-secondary">
              <MapPin className="h-3.5 w-3.5 text-muted mt-0.5 shrink-0" />
              <span>{rec.amenityNotes}</span>
            </div>
          )}

          {/* Reasoning */}
          <p className="text-xs text-muted italic">{rec.reasoning}</p>

          {/* Create Hunt button */}
          <button
            onClick={onCreateHunt}
            className="flex items-center gap-2 text-xs text-accent hover:text-accent-hover transition-colors font-medium"
          >
            <Tent className="h-3.5 w-3.5" />
            Create Hunt from This Unit
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function ResearchResults({
  recommendations,
  summary,
  userRankings,
  onUpdateRankings,
  onCreateHunt,
}: {
  recommendations: UnitRecommendation[]
  summary: string | null
  userRankings: string[] | null
  onUpdateRankings: (rankings: string[]) => void
  onCreateHunt: (rec: UnitRecommendation) => void
}) {
  // Apply user ranking order if present
  const orderedRecs = userRankings
    ? userRankings
        .map(unit => recommendations.find(r => r.unitNumber === unit))
        .filter((r): r is UnitRecommendation => !!r)
    : [...recommendations].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  // Include any recs not in the rankings (edge case)
  const rankedUnits = new Set(orderedRecs.map(r => r.unitNumber))
  const unranked = recommendations.filter(r => !rankedUnits.has(r.unitNumber))
  const allOrdered = [...orderedRecs, ...unranked]

  function moveUnit(index: number, direction: -1 | 1) {
    const newOrder = [...allOrdered]
    const target = index + direction
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]
    onUpdateRankings(newOrder.map(r => r.unitNumber))
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="bg-surface border border-subtle rounded-lg p-4">
          <p className="text-sm text-secondary">{summary}</p>
        </div>
      )}

      <div className="space-y-3">
        {allOrdered.map((rec, i) => (
          <UnitCard
            key={rec.unitNumber}
            rec={rec}
            displayRank={i + 1}
            onMoveUp={() => moveUnit(i, -1)}
            onMoveDown={() => moveUnit(i, 1)}
            isFirst={i === 0}
            isLast={i === allOrdered.length - 1}
            onCreateHunt={() => onCreateHunt(rec)}
          />
        ))}
      </div>

      <p className="text-xs text-muted text-center">
        Use ↑↓ arrows to reorder units by your preference. Rankings auto-save.
      </p>
    </div>
  )
}
