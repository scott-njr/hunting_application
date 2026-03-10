'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import { Send, CheckCircle, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Failed to send. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/bear_lake.JPG"
            alt="Mountain lake"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-7 w-7 text-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Contact Us</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-4">Get in Touch</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Questions, feedback, or partnership inquiries — we&apos;d love to hear from you. We read every message and respond as quickly as we can.
          </p>
        </div>

      {/* Form */}
      <div className="relative max-w-lg mx-auto px-4 py-16">
        {sent ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-primary mb-2">Message sent</h2>
            <p className="text-secondary text-sm mb-6">
              We&apos;ll get back to you as soon as we can.
            </p>
            <Link href="/" className="text-accent hover:text-accent-hover text-sm">
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-secondary text-sm mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full input-field"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-secondary text-sm mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-secondary text-sm mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full input-field resize-y"
                placeholder="How can we help?"
              />
              <p className="text-muted text-xs mt-1 text-right">{message.length}/5000</p>
            </div>

            {/* Honeypot — hidden from real users, bots fill it */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={e => setWebsite(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-semibold rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : (
                <>Send Message <Send className="h-4 w-4" /></>
              )}
            </button>
          </form>
        )}
      </div>
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
