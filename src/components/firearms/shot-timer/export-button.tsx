'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface ExportButtonProps {
  sessionId: string
}

/**
 * Triggers Practiscore-compatible CSV export for a session.
 */
export function ExportButton({ sessionId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/firearms/shot-timer/${sessionId}/export`)
      if (!res.ok) return

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shot-timer-${sessionId.slice(0, 8)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="p-1.5 text-muted hover:text-accent transition-colors disabled:opacity-50"
      title="Export CSV"
    >
      <Download className="h-4 w-4" />
    </button>
  )
}
