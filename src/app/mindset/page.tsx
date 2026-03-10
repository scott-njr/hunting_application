import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Brain, Target, Shield, Flame, Eye,
  Users,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'

export const metadata: Metadata = {
  title: 'Mindset Module — Mental Performance',
  description: 'Mental performance training for hunters and athletes — visualization, stress inoculation, focus drills, resilience building, and decision frameworks.',
}

const features = [
  {
    icon: Target,
    title: 'Pre-Hunt Visualization',
    description: 'Guided mental rehearsal for shot scenarios, stalk approaches, and high-pressure moments — build confidence before the hunt.',
  },
  {
    icon: Shield,
    title: 'Stress Inoculation',
    description: 'Train your nervous system to perform under pressure with progressive stress exposure drills and breathing protocols.',
  },
  {
    icon: Eye,
    title: 'Focus Training',
    description: 'Attention control exercises for long sits, glassing sessions, and maintaining awareness in the field over hours.',
  },
  {
    icon: Flame,
    title: 'Resilience Building',
    description: 'Mental toughness training for the hard days — bad weather, missed shots, tough pack-outs, and empty tags.',
  },
  {
    icon: Brain,
    title: 'Decision Frameworks',
    description: 'Structured thinking tools for field decisions — shoot or pass, approach strategy, risk assessment, and ethical judgment calls.',
  },
  {
    icon: Users,
    title: 'Accountability Partners',
    description: 'Pair up with others who are training their mindset. Set goals, check in weekly, and push each other to grow.',
  },
]

export default function MindsetPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/bear_lake_2.JPG"
            alt="Mountain reflection at golden hour"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-7 w-7 text-purple-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Mindset</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-400 mb-4">Become Who You're Meant to Be</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Mental preparation, focus training, stress management, and resilience — because the hardest part of the field isn&apos;t physical.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Mindset Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Mindset module is for anyone who has ever choked on a shot, lost focus on a long sit, or quit on a hard day when they should have pushed through. Physical preparation gets all the attention, but the mental game is what separates good from great — and this module trains it specifically.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Practice pre-hunt visualization to mentally rehearse shot scenarios and stalk approaches before you&apos;re in the moment. Train stress inoculation through progressive exposure drills so your nervous system stays calm when it counts. Build focus with attention control exercises designed for the patience-intensive reality of hunting and shooting. Develop resilience frameworks for the inevitable hard days.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          This isn&apos;t motivational fluff — it&apos;s structured mental training drawn from sports psychology, military performance science, and the real-world experience of hunters and athletes who have been there. The edge is mental, and this module sharpens it.
        </p>
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What&apos;s Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-purple-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/auth/signup" moduleName="Mindset" />
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
