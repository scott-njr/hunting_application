'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import type { ChatMessage } from './types'

const EXAMPLE_PROMPTS = [
  'Compare the top 2 units',
  'What about archery season?',
  'Nearby fishing opportunities?',
  'Best camp spots?',
  'What if I only have 3 days?',
  'Hunt codes for Unit {X}?',
]

export function ResearchChat({
  reportId,
  initialHistory,
  onSend,
  isLoading,
}: {
  reportId: string
  initialHistory: ChatMessage[]
  onSend: (message: string, history: ChatMessage[]) => Promise<void>
  isLoading: boolean
}) {
  const [prevReportId, setPrevReportId] = useState(reportId)
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync with initialHistory when reportId changes
  if (prevReportId !== reportId) {
    setPrevReportId(reportId)
    setMessages(initialHistory)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: msg }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await onSend(msg, updated)
  }

  // For simplicity, let parent manage the full flow.

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className="border border-subtle rounded-lg bg-elevated overflow-hidden">
      <div className="px-4 py-2 border-b border-subtle">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent" />
          Follow-up Questions
        </h3>
      </div>

      {/* Messages */}
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted text-center">Ask follow-up questions about your recommendations</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXAMPLE_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="text-xs text-left px-3 py-2 rounded border border-subtle bg-surface text-secondary hover:border-accent hover:text-primary transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-accent/15 border border-accent/30 text-primary'
                  : 'bg-surface border border-subtle text-secondary'
              }`}
            >
              {msg.role === 'assistant' && (
                <Sparkles className="h-3 w-3 text-accent inline mr-1.5 -mt-0.5" />
              )}
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-subtle rounded-lg px-3 py-2 text-sm text-muted">
              <Sparkles className="h-3 w-3 text-accent inline mr-1.5 animate-pulse" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-subtle flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Ask about units, hunt codes, terrain, fishing..."
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-surface border border-subtle text-primary rounded px-3 py-2 text-sm focus:border-accent focus:outline-none placeholder:text-muted resize-none disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="p-2 rounded bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 transition-colors shrink-0"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Re-export for parent to call appendAssistant
export type ResearchChatHandle = {
  appendAssistant: (content: string) => void
}
