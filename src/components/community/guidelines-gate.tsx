'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle } from 'lucide-react'
import { GUIDELINES } from '@/lib/community-guidelines'

export function GuidelinesGate({ isUpdate }: { isUpdate: boolean }) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch('/api/community/guidelines/accept', { method: 'POST' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-elevated border border-subtle rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-accent-hover" />
            <h2 className="text-lg font-semibold text-primary">Community Guidelines</h2>
          </div>
          {isUpdate ? (
            <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-800/30 rounded px-3 py-2 mt-3">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200 text-xs leading-relaxed">
                Our community guidelines have been updated. Please review and accept the changes to continue.
              </p>
            </div>
          ) : (
            <p className="text-secondary text-sm mt-1">
              Please review and accept our guidelines before joining the community.
            </p>
          )}
        </div>

        {/* Rules */}
        <div className="px-6 py-4 max-h-[40vh] overflow-y-auto space-y-4">
          {GUIDELINES.map((rule, i) => (
            <div key={i}>
              <h3 className="text-primary text-sm font-medium mb-1">
                {i + 1}. {rule.title}
              </h3>
              <p className="text-muted text-xs leading-relaxed">{rule.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-subtle">
          <p className="text-muted text-[10px] mb-3">
            By clicking &quot;I Agree&quot;, you acknowledge that you have read and agree to abide by these guidelines.
            Violations may result in content removal or account suspension with no refund of membership fees.
          </p>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-accent hover:bg-accent-hover text-primary font-medium text-sm py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {accepting ? 'Accepting...' : 'I Agree'}
          </button>
        </div>
      </div>
    </div>
  )
}
