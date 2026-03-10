import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Target, GraduationCap, Users, Ruler, Trophy,
  Video,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'

export const metadata: Metadata = {
  title: 'Archery Module — Training & Community',
  description: 'Structured archery training from beginner to competitive. Bow setup guides, form coaching, shot tracking, and a community of archers at every level.',
}

const features = [
  {
    icon: GraduationCap,
    title: 'Courses',
    description: 'Structured training from beginner to competitive. Form coaching, equipment guides, and drills.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with archers at every level. Gear reviews, competition reports, and coaching tips.',
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
  {
    icon: Target,
    title: 'Shot Trainer',
    description: 'Log sessions, track groups, and measure improvement over time with structured practice plans.',
  },
]

export default function ArcheryPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hunting/on_the_hunt.JPG"
            alt="Bowhunting in the field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-7 w-7 text-teal-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Archery</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-400 mb-4">Aim True. Shoot Often.</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            From your first bow to competitive shooting and bowhunting — structured training, equipment guides, form coaching, and a community of archers at every level.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Archery Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Archery module is designed for anyone who picks up a bow — whether you&apos;re shooting in your backyard for the first time, preparing for your first 3D competition, or fine-tuning form for bowhunting season. We break archery down into real, structured learning paths that meet you where you are.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Learn proper shooting form through video breakdowns and drill progressions. Get step-by-step bow setup and tuning guides for compound, recurve, and traditional bows. Track your practice sessions, log arrow groups, and measure improvement over time. Prepare for competitions with course strategy, mental game coaching, and tournament breakdowns.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          The archery community connects you with shooters at every level — share gear reviews, find local shoots, get coaching recommendations, and connect with partners who push you to get better. Whether you shoot targets or hunt with a bow, this module has something for you.
        </p>
        <ModuleCta moduleHref="/archery/my-archery" moduleName="Archery" inline />
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What&apos;s Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-teal-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/archery/my-archery" moduleName="Archery" />
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
