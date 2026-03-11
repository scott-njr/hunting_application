'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { PraeviusWordmark } from '@/components/ui/praevius-wordmark'
import { TierCards } from '@/components/pricing/tier-cards'
import {
  ChevronRight, ChevronLeft, User, CreditCard,
  AtSign, Check, X, Loader2,
} from 'lucide-react'
import { US_STATES, EXPERIENCE_OPTIONS, FITNESS_OPTIONS } from '@/components/profile/profile-constants'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [residentialState, setResidentialState] = useState('')
  const [experienceLevel, setExperienceLevel] = useState<string>('')
  const [fitnessLevel, setFitnessLevel] = useState<string>('')
  const [userName, setUserName] = useState('')
  const [userNameChecking, setUserNameChecking] = useState(false)
  const [userNameAvailable, setUserNameAvailable] = useState<boolean | null>(null)
  const userNameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced username availability check
  useEffect(() => {
    queueMicrotask(() => setUserNameAvailable(null))
    if (userName.length < 3) return
    if (userNameDebounce.current) clearTimeout(userNameDebounce.current)
    userNameDebounce.current = setTimeout(async () => {
      setUserNameChecking(true)
      try {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(userName)}`)
        const data = await res.json()
        setUserNameAvailable(data.available ?? false)
      } catch {
        setUserNameAvailable(null)
      } finally {
        setUserNameChecking(false)
      }
    }, 400)
    return () => { if (userNameDebounce.current) clearTimeout(userNameDebounce.current) }
  }, [userName])

  async function handleProfileSave() {
    if (!firstName.trim()) {
      setError('First name is required.')
      return
    }
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }
    if (!userName || userName.length < 3) {
      setError('Username is required (minimum 3 characters).')
      return
    }
    if (userNameAvailable === false) {
      setError('That username is already taken. Please choose another.')
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

    // Upsert user_profile with display_name, user_name, and state
    const { error: profileError } = await supabase
      .from('user_profile')
      .upsert({
        id: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        display_name: displayName.trim(),
        user_name: userName,
        state: residentialState,
      }, { onConflict: 'id' })

    if (profileError) {
      if (profileError.message.includes('user_name_unique') || profileError.message.includes('duplicate')) {
        setError('That username was just taken. Try another.')
        setUserNameAvailable(false)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    // Upsert hunting_profile with experience_level (if set)
    if (experienceLevel) {
      await supabase
        .from('hunting_profile')
        .upsert({
          id: user.id,
          experience_level: experienceLevel as 'beginner' | 'intermediate' | 'experienced' | 'expert',
        }, { onConflict: 'id' })
    }

    // Upsert fitness_profile with fitness_level (if set)
    if (fitnessLevel) {
      await supabase
        .from('fitness_profile')
        .upsert({
          id: user.id,
          fitness_level: fitnessLevel as 'just_starting' | 'moderately_active' | 'very_active' | 'competitive',
        }, { onConflict: 'id' })
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
          <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
            <PraeviusWordmark />
          </Link>
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
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-medium text-sm mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full input-field text-sm"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-primary font-medium text-sm mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full input-field text-sm"
                  maxLength={50}
                />
              </div>
            </div>

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

            {/* Username */}
            <div>
              <label className="block text-primary font-medium text-sm mb-2">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <AtSign className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                  className="w-full input-field text-sm pl-9 pr-10"
                  placeholder="buckslayer42"
                  maxLength={20}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {userNameChecking && <Loader2 className="h-4 w-4 text-muted animate-spin" />}
                  {!userNameChecking && userNameAvailable === true && <Check className="h-4 w-4 text-green-400" />}
                  {!userNameChecking && userNameAvailable === false && userName.length >= 3 && <X className="h-4 w-4 text-red-400" />}
                </div>
              </div>
              {userName.length > 0 && userName.length < 3 && (
                <p className="text-amber-400 text-xs mt-1">Minimum 3 characters</p>
              )}
              {!userNameChecking && userNameAvailable === false && userName.length >= 3 && (
                <p className="text-red-400 text-xs mt-1">That username is already taken</p>
              )}
              {!userNameChecking && userNameAvailable === true && (
                <p className="text-green-400 text-xs mt-1">Available!</p>
              )}
              <p className="text-muted text-[10px] mt-1">Lowercase letters, numbers, and underscores. 3-20 characters.</p>
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
