'use client'

import { useEffect, useState } from 'react'

interface SpyModeOverlayProps {
  /** Whether to trigger the visual flash */
  flash: boolean
}

/**
 * Full-screen green flash for spy mode visual-only start signal.
 * Replaces the audible beep so you can observe other shooters
 * or use visual starts without alerting the shooter.
 */
export function SpyModeOverlay({ flash }: SpyModeOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (flash) {
      setVisible(true)
      const timeout = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [flash])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        backgroundColor: 'rgba(124, 154, 110, 0.6)',
        animation: 'spy-flash 300ms ease-out forwards',
      }}
    >
      <style>{`
        @keyframes spy-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
