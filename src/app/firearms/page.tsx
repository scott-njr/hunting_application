import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Shield, BookOpen, Wrench, Target, Scale,
  ClipboardList,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Firearms Module — Safety & Training',
  description: 'Firearms safety fundamentals, range session tracking, maintenance logs, ballistics data, and state compliance tools for responsible gun owners.',
  alternates: { canonical: '/firearms' },
}

const features = [
  {
    icon: BookOpen,
    title: 'Safety Fundamentals',
    description: 'Core safety rules, safe handling practices, and storage requirements — the foundation everything else builds on.',
  },
  {
    icon: Target,
    title: 'Range Session Tracking',
    description: 'Log your range trips, track accuracy over time, and build structured practice routines that actually improve your shooting.',
  },
  {
    icon: Wrench,
    title: 'Maintenance Logs',
    description: 'Track round counts, cleaning schedules, and part replacements for every firearm in your collection.',
  },
  {
    icon: Scale,
    title: 'State Compliance',
    description: 'Stay current on your state\'s laws — transport rules, storage requirements, and carry regulations in one place.',
  },
  {
    icon: ClipboardList,
    title: 'Ballistics & Load Data',
    description: 'Ballistics calculators, handload recipes, and zero data for your specific setups — organized and accessible.',
  },
  {
    icon: Shield,
    title: 'Training Courses',
    description: 'Structured learning paths from first-time owners to advanced marksmanship, taught by certified instructors.',
  },
]

export default function FirearmsPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hunting/chad_and_scott_cuchara.JPG"
            alt="Hunters in the field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-7 w-7 text-blue-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Firearms — Safety & Maintenance Training</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400 mb-4">Safe, Confident, Competent</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            From your first purchase to confident handling — safety fundamentals, training logs, maintenance, and state compliance.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Firearms Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Firearms module is built for responsible gun owners who want to be safer, more competent, and better organized. Whether you just bought your first rifle or you&apos;ve been shooting for decades, this module gives you the structure and tools to stay sharp and stay legal.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Start with the fundamentals — safe handling, storage best practices, and the four rules that never change. From there, build real skill with structured range session tracking, accuracy logging, and practice plans designed around your goals. Keep your firearms maintained with round-count tracking, cleaning logs, and part replacement schedules.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          The compliance tools keep you informed on state-specific laws for transport, storage, and carry — because the rules matter and they change. Whether you shoot for sport, hunt, or carry for protection, this module helps you do it right.
        </p>
        <ModuleCta moduleHref="/firearms/my-firearms" moduleName="Firearms" inline />
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What&apos;s Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-blue-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/firearms/my-firearms" moduleName="Firearms" />
      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
