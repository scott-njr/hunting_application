import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Praevius — Lead the Wild',
  description: 'Structured paths, seasoned mentors, and a community built around hunting, firearms, fitness, and life. AI-powered draw strategy, field map, and expedition planning.',
  alternates: { canonical: '/' },
}
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import { RotatingPhotoStrip } from '@/components/ui/rotating-photo-strip'
import { AuthCta } from '@/components/ui/auth-cta'
import { AuthCtaButton } from '@/components/ui/auth-cta-button'
import {
  Crosshair, Shield, Dumbbell, Brain, ChevronRight,
  Bot, Calendar, BookOpen, Users, CheckCircle,
  Lock, ArrowRight, Route, UtensilsCrossed, Target,
  Ruler, Trophy, Video, Fish, Heart, Anchor,
} from 'lucide-react'

const modules = [
  {
    icon: Crosshair,
    name: 'Hunt',
    tagline: 'Plan Smarter. Hunt Better.',
    description:
      'AI-powered draw strategy, deadline tracking, field map, and expedition planning — whether it\'s your first tag or your twentieth.',
    status: 'featured' as const,
    href: null,
    cta: 'Get Started',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-900/20',
    border: 'border-amber-800/30 hover:border-amber-600/50',
    badge: 'badge-open',
    badgeLabel: 'Live Now',
  },
  {
    icon: Target,
    name: 'Archery',
    tagline: 'Aim True. Shoot Often.',
    description:
      'Courses, community, and training plans for bowhunters and archers — from form fundamentals to field accuracy.',
    status: 'featured' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-teal-400',
    iconBg: 'bg-teal-900/20',
    border: 'border-subtle',
    badge: 'badge-open',
    badgeLabel: 'Live Now',
  },
  {
    icon: Shield,
    name: 'Firearms',
    tagline: 'Safe, Confident, Competent',
    description:
      'From your first purchase to confident handling — safety fundamentals, training logs, maintenance, and state compliance.',
    status: 'soon' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-blue-400',
    iconBg: 'bg-blue-900/20',
    border: 'border-subtle',
    badge: 'badge-closed',
    badgeLabel: 'Coming Soon',
  },
  {
    icon: Dumbbell,
    name: 'Fitness',
    tagline: 'Built for Real Life',
    description:
      'Honest assessments, functional strength, rucking prep, and AI-matched programs — built for the field, not the mirror.',
    status: 'live' as const,
    href: '/fitness/my-plan',
    cta: 'Get Started',
    accent: 'text-green-400',
    iconBg: 'bg-green-900/20',
    border: 'border-green-800/30 hover:border-green-600/50',
    badge: 'badge-open',
    badgeLabel: 'Live Now',
  },
  {
    icon: Fish,
    name: 'Fishing',
    tagline: 'Read the Water. Land the Fish.',
    description:
      'Fly fishing, spin casting, and deep sea — species guides, water reading, gear selection, and a community of anglers.',
    status: 'soon' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-cyan-400',
    iconBg: 'bg-cyan-900/20',
    border: 'border-subtle',
    badge: 'badge-closed',
    badgeLabel: 'Coming Soon',
  },
  {
    icon: Heart,
    name: 'Medical',
    tagline: 'Be Ready When It Matters',
    description:
      'Wilderness first aid, trauma response, and backcountry medical — because help is hours away.',
    status: 'soon' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-red-400',
    iconBg: 'bg-red-900/20',
    border: 'border-subtle',
    badge: 'badge-closed',
    badgeLabel: 'Coming Soon',
  },
  {
    icon: Anchor,
    name: 'Spearfishing',
    tagline: 'Dive Deep. Spear True.',
    description:
      'Freediving technique, species ID, speargun selection, and dive planning for ocean hunters.',
    status: 'soon' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-sky-400',
    iconBg: 'bg-sky-900/20',
    border: 'border-subtle',
    badge: 'badge-closed',
    badgeLabel: 'Coming Soon',
  },
  {
    icon: Brain,
    name: 'Mindset',
    tagline: 'Become Who You\'re Meant to Be',
    description:
      'Values, resilience, goal architecture, and accountability — the internal work that makes everything else possible.',
    status: 'soon' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-purple-400',
    iconBg: 'bg-purple-900/20',
    border: 'border-subtle',
    badge: 'badge-closed',
    badgeLabel: 'Coming Soon',
  },
  {
    icon: UtensilsCrossed,
    name: 'The Butcher Block',
    tagline: 'From Field to Table',
    description:
      'Game and fish recipes, field-to-freezer processing techniques, and storage guides — honor your harvest from skinning to supper.',
    status: 'soon' as const,
    href: null,
    cta: 'Coming Soon',
    accent: 'text-red-400',
    iconBg: 'bg-red-900/20',
    border: 'border-subtle',
    badge: 'badge-closed',
    badgeLabel: 'Coming Soon',
  },
]

const huntFeatures = [
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'State, species, points — in. Ranked unit recommendations with full reasoning — out.',
  },
  {
    icon: Calendar,
    title: 'Deadline Tracker',
    description: 'Every application window, payment deadline, and results date for western states — tracked automatically.',
  },
  {
    icon: BookOpen,
    title: 'Courses',
    description: 'Draw strategy, unit scouting, field skills. Learn from people who actually do this.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Find verified hunting buddies in your area, get matched with mentors, and connect with hunters who share your interests.',
  },
]

const archeryFeatures = [
  {
    icon: Target,
    title: 'Shot Trainer',
    description: 'Log sessions, track groups, and measure improvement over time with structured practice plans.',
  },
  {
    icon: Ruler,
    title: 'Bow Setup & Tuning',
    description: 'Step-by-step guides for paper tuning, walk-back tuning, sight tapes, and arrow selection.',
  },
  {
    icon: Trophy,
    title: 'Competition Prep',
    description: '3D courses, indoor leagues, and tournament strategy — from local shoots to national events.',
  },
  {
    icon: Video,
    title: 'Form Analysis',
    description: 'Video breakdowns, anchor point drills, and shot execution fundamentals from experienced coaches.',
  },
]

const phases = [
  {
    phase: 'Beginner',
    label: 'Get Started',
    items: [
      'Understand what you\'re getting into',
      'Essential gear & terminology',
      'Licensing & legal requirements',
      'Your first guided steps',
    ],
  },
  {
    phase: 'Intermediate',
    label: 'Level Up',
    items: [
      'Refine your skills with mentors',
      'Advanced tools & strategy',
      'Community support & accountability',
      'Track your progress over time',
    ],
  },
  {
    phase: 'Expert',
    label: 'Set the Standard',
    items: [
      'Master-level strategy & planning',
      'Mentor and teach others',
      'Push your limits & compete',
      'Give back to the community',
    ],
  },
]

const promiseValues = [
  { icon: Route, label: 'Your Path, Your Pace', desc: 'Beginner, intermediate, or expert' },
  { icon: Users, label: 'Mentors & Pros', desc: 'Seasoned mentors and elite professionals' },
  { icon: CheckCircle, label: 'Community', desc: 'Connect with others at every level' },
  { icon: ArrowRight, label: 'Real Growth', desc: 'Measurable progress you can feel' },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/bear_lake_2.JPG"
            alt="Mountain lake with golden aspens"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-28 sm:pb-24 text-center">
          <p className="text-xs font-semibold text-muted uppercase tracking-[0.2em] mb-5">
            by Praevius
          </p>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-[0.14em] uppercase mb-3 leading-[1.05]">
            Lead the Wild
          </h1>
          <p className="text-accent text-lg font-semibold mb-5">
            Wherever you are. Wherever you&apos;re headed.
          </p>
          <p className="text-secondary text-lg max-w-2xl mx-auto mb-8">
            Structured paths, seasoned mentors, elite professionals, and a
            community built around the things that matter — hunting, firearms,
            fitness, and life.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <AuthCta
              authedHref="/home"
              authedLabel="Go to Command Center"
              className="btn-primary font-bold rounded-lg px-8 py-3 text-sm transition-colors"
            >
              <AuthCtaButton
                view="signup"
                className="btn-primary font-bold rounded-lg px-8 py-3 text-sm transition-colors"
              >
                Get Started
              </AuthCtaButton>
            </AuthCta>
            <Link
              href="/pricing"
              className="text-secondary hover:text-primary text-sm transition-colors flex items-center gap-1"
            >
              See plans <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* The Path — Meet you where you are */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-subtle">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest text-center mb-2">
          The Praevius Path
        </p>
        <h2 className="text-2xl font-bold text-center mb-3">
          We meet you where you are.
        </h2>
        <p className="text-secondary text-sm text-center max-w-lg mx-auto mb-10">
          Just getting started? Been doing this for years? It doesn&apos;t matter.
          Every module is built to challenge you at your level and push you forward.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {phases.map((p, i) => (
            <div
              key={p.phase}
              className="bg-surface border border-subtle rounded-xl p-6 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-transparent"
                style={{ opacity: 0.4 + i * 0.3 }}
              />
              <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-1">
                {p.phase}
              </p>
              <h3 className="text-primary font-bold text-lg mb-4">{p.label}</h3>
              <ul className="space-y-2.5">
                {p.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-secondary">
                    <span className="text-accent mt-0.5 shrink-0 text-xs">&#9656;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Photo strip — rotating */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-subtle">
        <RotatingPhotoStrip />
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-subtle">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest text-center mb-2">
          The Platform
        </p>
        <h2 className="text-2xl font-bold text-center mb-3">Multiple modules. One platform.</h2>
        <p className="text-secondary text-sm text-center max-w-lg mx-auto mb-10">
          Each module is designed for every skill level —
          with structured paths, real mentors, and a community that has your back.
        </p>

        {/* Featured: Hunt module (live) */}
        <div className="bg-surface border border-amber-800/30 hover:border-amber-600/50 rounded-2xl overflow-hidden transition-colors mb-5">
          <div className="px-6 pt-6 pb-4 border-b border-subtle/60">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-amber-900/20 rounded-xl p-3">
                <Crosshair className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full badge-open">
                Live Now
              </span>
            </div>
            <h3 className="text-primary font-bold text-lg mb-0.5">Hunt</h3>
            <p className="text-xs font-medium uppercase tracking-wide text-amber-400">Plan Smarter. Hunt Better.</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-secondary text-sm leading-relaxed mb-5">
              AI-powered draw strategy, deadline tracking, field map, and expedition planning — whether it&apos;s your first tag or your twentieth.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {huntFeatures.map(({ icon: FIcon, title, description }) => (
                <div key={title} className="flex gap-3">
                  <div className="bg-amber-900/20 rounded-lg p-2 h-fit shrink-0">
                    <FIcon className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-primary text-sm font-medium">{title}</p>
                    <p className="text-muted text-xs">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <AuthCta
              authedHref="/hunting/my-hunts"
              authedLabel="Access Hunt Module →"
              className="inline-flex items-center justify-between gap-2 btn-primary font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              <AuthCtaButton
                view="signup"
                className="inline-flex items-center justify-between gap-2 btn-primary font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors group"
              >
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </AuthCtaButton>
            </AuthCta>
            <p className="text-muted text-xs mt-2">No credit card required. Free forever plan available.</p>
          </div>
        </div>

        {/* Featured: Archery module — LIVE */}
        <div className="bg-surface border border-teal-800/30 hover:border-teal-600/50 rounded-2xl overflow-hidden transition-colors mb-5">
          <div className="px-6 pt-6 pb-4 border-b border-subtle/60">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-teal-900/20 rounded-xl p-3">
                <Target className="h-5 w-5 text-teal-400" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full badge-open">
                Live Now
              </span>
            </div>
            <h3 className="text-primary font-bold text-lg mb-0.5">Archery</h3>
            <p className="text-xs font-medium uppercase tracking-wide text-teal-400">Aim True. Shoot Often.</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-secondary text-sm leading-relaxed mb-5">
              From your first bow to competitive shooting and bowhunting — structured training, equipment guides, form coaching, and a community of archers at every level.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {archeryFeatures.map(({ icon: FIcon, title, description }) => (
                <div key={title} className="flex gap-3">
                  <div className="bg-teal-900/20 rounded-lg p-2 h-fit shrink-0">
                    <FIcon className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-primary text-sm font-medium">{title}</p>
                    <p className="text-muted text-xs">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <AuthCta
              authedHref="/archery/my-archery"
              authedLabel="Access Archery Module →"
              className="inline-flex items-center justify-between gap-2 btn-primary font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              <AuthCtaButton
                view="signup"
                className="inline-flex items-center justify-between gap-2 btn-primary font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors group"
              >
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </AuthCtaButton>
            </AuthCta>
            <p className="text-muted text-xs mt-2">No credit card required. Free forever plan available.</p>
          </div>
        </div>

        {/* Other modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.filter((m) => m.status !== 'featured').map((mod) => {
            const Icon = mod.icon
            const isLive = mod.status === 'live'
            return (
              <div
                key={mod.name}
                className={`bg-surface border ${mod.border} rounded-2xl flex flex-col overflow-hidden${!isLive ? ' opacity-60' : ''}`}
              >
                <div className="px-5 pt-5 pb-4 border-b border-subtle/60">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${mod.iconBg} rounded-xl p-3`}>
                      <Icon className={`h-5 w-5 ${mod.accent}`} />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mod.badge}`}>
                      {mod.badgeLabel}
                    </span>
                  </div>
                  <h3 className="text-primary font-bold text-lg mb-0.5">{mod.name}</h3>
                  <p className={`text-xs font-medium uppercase tracking-wide ${mod.accent}`}>{mod.tagline}</p>
                </div>
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <p className="text-secondary text-sm leading-relaxed flex-1 mb-5">{mod.description}</p>
                  {isLive ? (
                    <AuthCta
                      authedHref={mod.href!}
                      authedLabel={`Access ${mod.name} Module →`}
                      className="inline-flex items-center justify-between gap-2 btn-primary font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
                    >
                      <AuthCtaButton
                        view="signup"
                        className="inline-flex items-center justify-between gap-2 btn-primary font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors group"
                      >
                        Get Started
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </AuthCtaButton>
                    </AuthCta>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-between gap-2 bg-elevated text-muted rounded-lg px-4 py-2.5 text-sm font-medium cursor-not-allowed"
                    >
                      Coming Soon
                      <Lock className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Promise */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-subtle">
        <div className="relative rounded-2xl overflow-hidden border border-default bg-surface">
          <div className="topo-texture" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent-dim rounded-full blur-3xl pointer-events-none" />

          <div className="relative px-8 py-10 md:px-12 md:py-12">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">
              The Praevius Promise — Across Every Module
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              You&apos;re not just learning —<br />you&apos;re becoming.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {promiseValues.map(({ icon: VIcon, label, desc }) => (
                <div key={label} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="bg-accent-dim rounded-lg p-2.5">
                      <VIcon className="h-5 w-5 text-accent-hover" />
                    </div>
                  </div>
                  <h3 className="text-primary font-semibold text-sm mb-1">{label}</h3>
                  <p className="text-muted text-xs italic">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-10 flex-wrap">
              <AuthCta
                authedHref="/home"
                authedLabel="Go to Command Center"
                className="bg-white hover:bg-white text-black font-bold rounded-lg px-6 py-2.5 text-sm transition-colors"
              >
                <AuthCtaButton
                  view="signup"
                  className="bg-white hover:bg-white text-black font-bold rounded-lg px-6 py-2.5 text-sm transition-colors"
                >
                  Get Started
                </AuthCtaButton>
              </AuthCta>
              <Link
                href="/pricing"
                className="text-secondary hover:text-primary text-sm transition-colors"
              >
                See Plans &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p className="text-secondary font-bold tracking-wide mb-0.5">LEAD THE WILD</p>
        <p className="text-muted italic mb-3">by Praevius</p>
        <p className="mb-2">
          <a href="/changelog" className="text-secondary hover:text-primary transition-colors underline underline-offset-2">Changelog</a>
        </p>
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
        <p className="mt-1 max-w-md mx-auto">
          Lead the Wild provides guidance and tools only. Always verify requirements
          and regulations through official sources.
        </p>
      </footer>
    </div>
  )
}
