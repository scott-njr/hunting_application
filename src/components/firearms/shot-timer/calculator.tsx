'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalculatorProps {
  open: boolean
  onClose: () => void
}

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
] as const

/**
 * Simple calculator modal for quick math during training sessions.
 */
export function Calculator({ open, onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [resetNext, setResetNext] = useState(false)

  if (!open) return null

  function handleButton(btn: string) {
    switch (btn) {
      case 'C':
        setDisplay('0')
        setPrevValue(null)
        setOperator(null)
        setResetNext(false)
        break

      case '⌫':
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
        break

      case '±':
        setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev)
        break

      case '%':
        setDisplay(prev => (parseFloat(prev) / 100).toString())
        break

      case '÷': case '×': case '−': case '+':
        setPrevValue(parseFloat(display))
        setOperator(btn)
        setResetNext(true)
        break

      case '=': {
        if (prevValue === null || !operator) break
        const current = parseFloat(display)
        let result: number
        switch (operator) {
          case '+': result = prevValue + current; break
          case '−': result = prevValue - current; break
          case '×': result = prevValue * current; break
          case '÷': result = current !== 0 ? prevValue / current : 0; break
          default: result = current
        }
        setDisplay(Number.isFinite(result) ? parseFloat(result.toFixed(10)).toString() : 'Error')
        setPrevValue(null)
        setOperator(null)
        setResetNext(true)
        break
      }

      case '.':
        if (resetNext) {
          setDisplay('0.')
          setResetNext(false)
        } else if (!display.includes('.')) {
          setDisplay(prev => prev + '.')
        }
        break

      default: // Digits 0-9
        if (resetNext) {
          setDisplay(btn)
          setResetNext(false)
        } else {
          setDisplay(prev => prev === '0' ? btn : prev + btn)
        }
    }
  }

  const isOperator = (btn: string) => ['÷', '×', '−', '+'].includes(btn)
  const isAction = (btn: string) => ['C', '±', '%', '⌫'].includes(btn)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface border border-subtle rounded-t-2xl sm:rounded-2xl w-full max-w-xs mx-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h3 className="text-primary font-bold text-sm">Calculator</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display */}
        <div className="px-4 py-3">
          <div className="bg-elevated border border-subtle rounded-lg px-4 py-3 text-right">
            {operator && prevValue !== null && (
              <p className="text-muted text-xs font-mono mb-1">
                {prevValue} {operator}
              </p>
            )}
            <p className="text-primary font-mono font-bold text-2xl truncate">{display}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-3 pb-4 grid grid-cols-4 gap-2">
          {BUTTONS.flat().map((btn, i) => (
            <button
              key={i}
              onClick={() => handleButton(btn)}
              className={cn(
                'py-3 rounded-xl text-center font-medium text-lg transition-colors',
                btn === '=' ? 'bg-accent text-base hover:bg-accent/90' :
                isOperator(btn) ? 'bg-amber-700/30 text-amber-400 hover:bg-amber-700/50' :
                isAction(btn) ? 'bg-elevated text-secondary hover:bg-surface' :
                'bg-elevated text-primary hover:bg-surface'
              )}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
