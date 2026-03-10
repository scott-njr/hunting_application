'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { TierCards } from '@/components/pricing/tier-cards'
import {
  Crosshair, Fish, Shield, Dumbbell, Brain, Target,
  ChevronRight, ChevronLeft, User, CreditCard,
} from 'lucide-react'

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner', desc: 'New to this — ready to learn' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience — looking to level up' },
  { value: 'expert', label: 'Expert', desc: 'Seasoned — here for community and tools' },
] as const

const INTEREST_OPTIONS = [
  { value: 'hunting', label: 'Hunting', icon: Crosshair },
  { value: 'archery', label: 'Archery', icon: Target },
  { value: 'fishing', label: 'Fishing', icon: Fish },
  { value: 'firearms', label: 'Firearms', icon: Shield },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell },
  { value: 'mindset', label: 'Mindset', icon: Brain },
] as const

const FITNESS_OPTIONS = [
  { value: 'just_starting', label: 'Just Starting Out', desc: 'Getting back into it or brand new' },
  { value: 'moderately_active', label: 'Moderately Active', desc: 'Regular activity, room to grow' },
  { value: 'very_active', label: 'Very Active', desc: 'Consistent training and outdoor activity' },
  { value: 'competitive', label: 'Competitive / Athletic', desc: 'High-level fitness, pushing limits' },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState('')
  const [residentialState, setResidentialState] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [interests, setInterests] = useState<string[]>([])
  const [fitnessLevel, setFitnessLevel] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleInterest(value: string) {
    setInterests(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  async function handleProfileSave() {
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }
    if (!residentialState) {
      setError('Please select your state.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: updateError } = await supabase
      .from('members')
      .update({
        full_name: displayName.trim(),
        residential_state: residentialState,
        experience_level: (experienceLevel || null) as 'beginner' | 'intermediate' | 'expert' | null,
        interests,
        fitness_level: (fitnessLevel || null) as 'just_starting' | 'moderately_active' | 'very_active' | 'competitive' | null,
      })
      .eq('id', user.id)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(2)
  }

  async function finishOnboarding() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    await supabase
      .from('members')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="hover:opacity-80 transition-opacity inline-block">
            <PraeviusWordmark />
          </a>
          <p className="text-secondary text-sm mt-2">
            {step === 1 ? 'Set up your profile' : 'Choose your plan'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            step === 1 ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent/60'
          }`}>
            <User className="h-3.5 w-3.5" />
            Profile
          </div>
          <div className="w-8 h-px bg-subtle" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            step === 2 ? 'bg-accent/15 text-accent' : 'bg-elevated text-muted'
          }`}>
            <CreditCard className="h-3.5 w-3.5" />
            Plan
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/50 border border-red-500/30 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Profile Setup */}
        {step === 1 && (
          <div className="glass-card rounded-lg p-8 space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-primary font-medium text-sm mb-2">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How should we address you?"
                className="w-full input-field text-sm"
                maxLength={50}
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-primary font-medium text-sm mb-2">
                Home State <span className="text-red-400">*</span>
              </label>
              <select
                value={residentialState}
                onChange={e => setResidentialState(e.target.value)}
                className="w-full input-field text-sm"
              >
                <option value="">Select your state</option>
                {US_STATES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-primary font-medium text-sm mb-3">
                Experience Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {EXPERIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperienceLevel(opt.value)}
                    className={`flex flex-col items-center text-center p-3 rounded-lg border transition-colors ${
                      experienceLevel === opt.value
                        ? 'border-green-500/60 bg-green-950/30 text-primary'
                        : 'border-subtle bg-surface hover:border-default text-secondary'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-primary font-medium text-sm mb-3">
                What are you interested in?
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const selected = interests.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleInterest(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                        selected
                          ? 'border-green-500/60 bg-green-950/30 text-primary'
                          : 'border-subtle bg-surface hover:border-default text-secondary'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-primary font-medium text-sm mb-3">
                Fitness Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FITNESS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFitnessLevel(opt.value)}
                    className={`flex flex-col items-start text-left p-3 rounded-lg border transition-colors ${
                      fitnessLevel === opt.value
                        ? 'border-green-500/60 bg-green-950/30 text-primary'
                        : 'border-subtle bg-surface hover:border-default text-secondary'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={loading}
                className="btn-primary font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Continue'}
                {!loading && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Your Plan */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-primary font-semibold text-lg mb-1">Choose Your Plan</h2>
              <p className="text-secondary text-sm mb-6">
                Select a tier for each module to unlock full access. Free tier gives you public pages only — upgrade to access module tools, courses, and community.
              </p>

              <Suspense fallback={<div className="h-40 animate-pulse bg-elevated rounded-lg" />}>
                <TierCards onTierChanged={() => {}} />
              </Suspense>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-muted hover:text-secondary text-sm transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Profile
              </button>
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={loading}
                className="btn-primary font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Finishing...' : 'Continue with Current Selections'}
                {!loading && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>

            <p className="text-muted text-xs text-center">
              You can change your plan anytime from your account settings.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
