'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIProgressModal } from '@/components/ui/ai-progress-modal'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const EXAMPLE_CATEGORIES = [
  {
    label: 'Training',
    prompts: [
      'What should I focus on this week?',
      'Am I on track with my run plan?',
      'How do I improve my 2-mile time?',
    ],
  },
  {
    label: 'Nutrition',
    prompts: [
      'Break down my macros for today.',
      'What should I eat before a long run?',
      'Am I getting enough protein for my goals?',
    ],
  },
  {
    label: 'Progress',
    prompts: [
      'How am I progressing overall?',
      'Compare my baseline tests over time.',
      'Review my recent session notes and give feedback.',
    ],
  },
  {
    label: 'Recovery',
    prompts: [
      'How many rest days should I take this week?',
      'I feel sore after strength day — what should I do?',
      'How should I adjust if I missed sessions?',
    ],
  },
]

const COACH_LOADING_STEPS = [
  'Reviewing your training data...',
  'Analyzing recent workouts...',
  'Checking your baseline progress...',
  'Preparing personalized advice...',
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FitnessCoachChat({ userId: _userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Send prior turns as history (exclude the message we just appended)
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/fitness/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.ok
          ? data.response
          : (data.error ?? 'Something went wrong. Please try again.'),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Unable to reach your coach. Please check your connection and try again.',
        },
      ])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <>
      <AIProgressModal
        open={isLoading}
        featureLabel="AI Fitness Coach"
        steps={COACH_LOADING_STEPS}
      />

      <div className="bg-surface border border-subtle rounded-lg flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
              <div className="text-center">
                <Bot className="h-10 w-10 text-accent opacity-60 mx-auto mb-2" />
                <h2 className="text-primary font-bold text-lg">What can I help with?</h2>
                <p className="text-muted text-xs mt-1">
                  I have access to your plans, logs, baselines, and WOW scores.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-3xl">
                {EXAMPLE_CATEGORIES.map(cat => (
                  <div key={cat.label} className="space-y-2">
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">{cat.label}</span>
                    {cat.prompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="block w-full text-left text-xs bg-elevated border border-default text-secondary hover:text-primary hover:border-accent/50 rounded-lg px-3 py-2 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] px-4 py-3 rounded-lg text-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-accent/20 text-primary border border-accent/30'
                      : 'bg-elevated text-secondary border border-subtle',
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-subtle flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Ask your coach..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-elevated border border-default text-primary rounded px-3 py-2 text-sm focus:border-accent focus:outline-none placeholder:text-muted resize-none disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="text-accent disabled:opacity-40 transition-colors pb-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-muted text-xs text-center mt-3">
        AI guidance only. Consult a physician before changing your exercise program.
      </p>
    </>
  )
}
