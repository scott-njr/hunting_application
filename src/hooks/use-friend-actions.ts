'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Friend, SearchResult } from '@/types/friends'

type Options = {
  initialFriends: Friend[]
  currentUserId: string | null
  onRemoveFriend?: (friendshipId: string) => void
}

export function useFriendActions({ initialFriends, currentUserId, onRemoveFriend }: Options) {
  const [friends, setFriends] = useState<Friend[]>(initialFriends)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const accepted = friends.filter(f => f.status === 'accepted')
  const pendingIn = friends.filter(f => f.status === 'pending' && f.direction === 'received')
  const pendingOut = friends.filter(f => f.status === 'pending' && f.direction === 'sent')

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/users/find?q=${encodeURIComponent(searchQuery)}`)
        if (!res.ok) return
        const data = await res.json()
        const existingIds = new Set([currentUserId, ...friends.map(f => f.friend_id)])
        setSearchResults((data.results ?? []).filter((r: SearchResult) => !existingIds.has(r.user_id)))
      } catch {
        // network error — silently ignore search failure
      } finally { setSearching(false) }
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [searchQuery, friends, currentUserId])

  const sendRequest = useCallback(async (recipientId: string) => {
    setActionLoading(recipientId)
    setError(null)
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: recipientId }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      const target = searchResults.find(r => r.user_id === recipientId)
      if (target) {
        setFriends(prev => [...prev, {
          friendship_id: crypto.randomUUID(),
          friend_id: recipientId,
          display_name: target.display_name,
          email: '',
          direction: 'sent' as const,
          status: 'pending' as const,
          created_on: new Date().toISOString(),
        }])
        setSearchResults(prev => prev.filter(r => r.user_id !== recipientId))
      }
    } finally { setActionLoading(null) }
  }, [searchResults])

  const respond = useCallback(async (friendshipId: string, action: 'accept' | 'decline') => {
    setActionLoading(friendshipId)
    try {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      })
      if (!res.ok) return
      if (action === 'accept') {
        setFriends(prev => prev.map(f => f.friendship_id === friendshipId ? { ...f, status: 'accepted' as const } : f))
      } else {
        setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      }
    } finally { setActionLoading(null) }
  }, [])

  const removeFriend = useCallback(async (friendshipId: string) => {
    setActionLoading(friendshipId)
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      if (!res.ok) { setError('Failed to remove friend'); return }
      setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      onRemoveFriend?.(friendshipId)
    } finally { setActionLoading(null) }
  }, [onRemoveFriend])

  return {
    friends,
    setFriends,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    actionLoading,
    error,
    accepted,
    pendingIn,
    pendingOut,
    sendRequest,
    respond,
    removeFriend,
  }
}
