'use client'

import { useState, useEffect } from 'react'
import { Mic, Shield, X } from 'lucide-react'
import { MIC_CONSENT_KEY, MIC_CONSENT_EXPIRY_MS } from './shot-timer-types'

interface MicConsentModalProps {
  open: boolean
  onAccept: () => void
  onDecline: () => void
}

/** Check if mic consent is still valid (within 30-day window) */
export function hasMicConsent(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(MIC_CONSENT_KEY)
  if (!stored) return false
  const timestamp = parseInt(stored, 10)
  return Date.now() - timestamp < MIC_CONSENT_EXPIRY_MS
}

/** Store mic consent with current timestamp */
export function setMicConsent(): void {
  localStorage.setItem(MIC_CONSENT_KEY, Date.now().toString())
}

export function MicConsentModal({ open, onAccept, onDecline }: MicConsentModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) setVisible(true)
    else {
      const timeout = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [open])

  if (!visible) return null

  function handleAccept() {
    setMicConsent()
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onDecline} />

      {/* Modal */}
      <div className="relative bg-surface border border-subtle rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={onDecline}
          className="absolute top-3 right-3 text-muted hover:text-primary transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Mic className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-primary font-bold text-lg">Microphone Access</h3>
        </div>

        {/* Description */}
        <p className="text-secondary text-sm mb-3">
          Shot Timer uses your microphone to detect shot sounds in real-time.
        </p>

        {/* Privacy notice */}
        <div className="bg-elevated border border-subtle rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-primary font-medium mb-1">Your Privacy</p>
              <p className="text-muted text-xs leading-relaxed">
                Audio is processed locally in your browser and immediately discarded.
                No audio is recorded, stored, or transmitted. Only timing data
                (millisecond timestamps) and volume intensity readings (numeric values
                0-255) are saved to power your shot pattern visualizations.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary border border-subtle rounded-lg hover:bg-elevated transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-base bg-accent hover:bg-accent/90 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Allow Microphone
          </button>
        </div>
      </div>
    </div>
  )
}
