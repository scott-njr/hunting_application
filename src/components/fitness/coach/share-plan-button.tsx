'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, X } from 'lucide-react'
import { TacticalSelect } from '@/components/ui/tactical-select'

interface Friend {
  friend_id: string
  display_name: string
}

export function SharePlanButton({ planId }: { planId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/friends')
      .then(r => { if (!r.ok) return { friends: [] }; return r.json() })
      .then(d => setFriends(d.friends ?? []))
  }, [open])

  async function handleShare() {
    if (!selectedFriend) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/fitness/plans/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, friend_id: selectedFriend }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to share')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      setOpen(false)
      setSuccess(false)
      setSelectedFriend('')
      router.refresh()
    }, 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-muted hover:text-accent transition-colors p-1"
        title="Share plan with a friend"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface border border-subtle rounded-lg p-5 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-primary font-bold text-sm">Share Plan with Friend</h3>
              <button onClick={() => { setOpen(false); setError(''); setSuccess(false) }} className="text-muted hover:text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <p className="text-green-400 text-sm">Plan shared! Your friend will see it on their My Plan page.</p>
            ) : (
              <>
                {friends.length === 0 ? (
                  <p className="text-muted text-sm">No friends yet. Add friends to share plans.</p>
                ) : (
                  <div className="space-y-3">
                    <TacticalSelect
                      value={selectedFriend}
                      onChange={setSelectedFriend}
                      placeholder="Select a friend..."
                      options={friends.map(f => ({
                        value: f.friend_id,
                        label: f.display_name,
                      }))}
                    />

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <button
                      onClick={handleShare}
                      disabled={!selectedFriend || loading}
                      className="btn-primary w-full py-2 text-sm rounded disabled:opacity-40"
                    >
                      {loading ? 'Sharing...' : 'Share Plan'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
