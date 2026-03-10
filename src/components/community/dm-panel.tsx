'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

type Friend = {
  friendship_id: string
  friend_id: string
  display_name: string | null
  email: string
  direction: 'sent' | 'received'
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_at: string
}

type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read_at: string | null
  created_at: string
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string | null, email: string): string {
  if (name) return name.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export function DmPanel({
  friend,
  currentUserId,
  onBack,
}: {
  friend: Friend
  currentUserId: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/messages?friend_id=${friend.friend_id}`)
      .then(r => r.json())
      .then(data => setMessages(data.messages ?? []))
      .finally(() => setLoading(false))
  }, [friend.friend_id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: friend.friend_id, content: newMessage.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      }
    } finally { setSending(false) }
  }

  const label = friend.display_name || friend.email

  return (
    <div className="bg-elevated border border-subtle rounded-lg flex flex-col h-[420px]">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-subtle">
        <button onClick={onBack} className="text-muted hover:text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="w-6 h-6 rounded-full bg-elevated flex items-center justify-center text-xs font-semibold text-primary">
          {initials(friend.display_name, friend.email)}
        </div>
        <span className="text-primary text-sm font-medium flex-1 truncate">{label}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <p className="text-muted text-xs text-center pt-4">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-muted text-xs text-center pt-4">No messages yet. Say hi!</p>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] px-3 py-2 rounded-lg text-sm', isOwn ? 'bg-accent text-primary' : 'bg-elevated text-secondary')}>
                  <p>{msg.content}</p>
                  <p className={cn('text-xs mt-1', isOwn ? 'text-accent-hover' : 'text-muted')}>{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="px-3 py-2 border-t border-subtle flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Message..."
          className="flex-1 bg-elevated border border-default text-primary rounded px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none placeholder:text-muted"
        />
        <button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="text-accent-hover disabled:opacity-40 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
