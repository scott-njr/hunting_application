import Link from 'next/link'
import { Mail } from 'lucide-react'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

interface MessagePreview {
  senderName: string
  content: string
  createdAt: string
}

interface MessagesPreviewProps {
  unreadCount: number
  previews: MessagePreview[]
}

export function MessagesPreview({ unreadCount, previews }: MessagesPreviewProps) {
  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" />
          <span className="text-primary font-semibold text-sm">Messages</span>
        </div>
        {unreadCount > 0 && (
          <span className="bg-accent text-base text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {unreadCount}
          </span>
        )}
      </div>

      {previews.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-muted text-xs">No new messages</p>
        </div>
      ) : (
        <div className="divide-y divide-subtle">
          {previews.map((msg, i) => (
            <div key={i} className="px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-primary text-xs font-medium">{msg.senderName}</span>
                <span className="text-[10px] text-muted">{timeAgo(msg.createdAt)}</span>
              </div>
              <p className="text-muted text-xs mt-0.5 truncate">{msg.content}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/home/messages"
        className="block px-4 py-2.5 text-xs text-accent hover:text-accent-hover text-center border-t border-subtle hover:bg-elevated transition-colors"
      >
        View all &rarr;
      </Link>
    </div>
  )
}
