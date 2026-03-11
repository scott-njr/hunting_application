'use client'

import { Medal, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCALING_BADGE: Record<string, { label: string; className: string }> = {
  rx: { label: 'RX', className: 'bg-green-500/20 text-green-400' },
  scaled: { label: 'Scaled', className: 'bg-amber-500/20 text-amber-400' },
  beginner: { label: 'Beginner', className: 'bg-blue-500/20 text-blue-400' },
}

export type LeaderboardRowData = {
  rank: number
  displayName: string
  userName: string | null
  avatarUrl: string | null
  isMine: boolean
  scaling?: string
  scoreDisplay?: string
  totalPoints?: number
  weeksParticipated?: number
  communityPostId?: string | null
}

export function LeaderboardRow({ data }: { data: LeaderboardRowData }) {
  const {
    rank,
    displayName,
    userName,
    avatarUrl,
    isMine,
    scaling,
    scoreDisplay,
    totalPoints,
    weeksParticipated,
    communityPostId,
  } = data

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        isMine && 'bg-accent/5'
      )}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0 text-center">
        {rank <= 3 ? (
          <Medal className={cn(
            'h-5 w-5 mx-auto',
            rank === 1 ? 'text-amber-400' :
            rank === 2 ? 'text-gray-400' :
            'text-amber-700'
          )} />
        ) : (
          <span className="text-muted text-sm font-medium">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-[10px] font-semibold text-primary">
            {initials}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isMine ? 'text-accent' : 'text-primary')}>
          {displayName}{isMine ? ' (you)' : ''}
        </p>
        {userName && (
          <p className="text-muted text-[10px] truncate">@{userName}</p>
        )}
      </div>

      {/* Scaling badge (weekly view) */}
      {scaling && SCALING_BADGE[scaling] && (
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded flex-shrink-0',
          SCALING_BADGE[scaling].className
        )}>
          {SCALING_BADGE[scaling].label}
        </span>
      )}

      {/* Score or Points */}
      {scoreDisplay && (
        <span className="text-primary font-mono text-sm font-semibold w-20 text-right flex-shrink-0">
          {scoreDisplay}
        </span>
      )}
      {totalPoints !== undefined && (
        <div className="text-right flex-shrink-0 w-24">
          <span className="text-primary font-mono text-sm font-semibold">{totalPoints} pts</span>
          {weeksParticipated !== undefined && (
            <p className="text-muted text-[10px]">{weeksParticipated}w</p>
          )}
        </div>
      )}

      {/* Community post link */}
      {communityPostId && (
        <button
          className="flex-shrink-0 text-muted hover:text-accent transition-colors"
          title="View post"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
