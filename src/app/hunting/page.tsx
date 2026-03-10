import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Crosshair, Calendar, MapPin, Bot, Package, Tent,
  BookOpen, Users,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'

export const metadata: Metadata = {
  title: 'Hunting Module — AI Draw Strategy & Scouting',
  description: 'AI-powered draw strategy, deadline tracking, field scouting with GPS waypoints, and expedition planning for western big game hunters at every level.',
}

const features = [
  {
    icon: Calendar,
    title: 'Deadline Tracker',
    description: 'Every application window, payment deadline, and results date for western states — tracked automatically.',
  },
  {
    icon: MapPin,
    title: 'Scout',
    description: 'Pin sightings, sign, and waypoints on topo maps with auto-stamped weather conditions.',
  },
  {
    icon: Bot,
    title: 'AI Scout Reports',
    description: 'Get AI-generated scouting intel for any GMU — terrain, access, species behavior, and more.',
  },
  {
    icon: Tent,
    title: 'Hunt Plans',
    description: 'Plan trips with gear lists, budgets, hunt party, and multiple scout locations per trip.',
  },
  {
    icon: Package,
    title: 'Gear Checklist',
    description: 'Track your gear across 150+ items. Know what you have and what you still need.',
  },
  {
    icon: BookOpen,
    title: 'Courses',
    description: 'Draw strategy, unit scouting, field skills. Learn from people who actually do this.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Find hunting buddies in your area, get matched with mentors, and connect with hunters who share your interests.',
  },
]

export default function HuntingPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>


      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hunting/cuchara_main_view.JPG"
            alt="Mountain hunting landscape"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Crosshair className="h-7 w-7 text-amber-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Hunting</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-400 mb-4">Plan Smarter. Hunt Better.</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            AI-powered draw strategy, deadline tracking, field scouting, and expedition planning — whether it&apos;s your first tag or your twentieth.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Hunting Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Hunting module is built for western big game hunters at every experience level. Whether you&apos;re trying to understand the draw system for the first time or you&apos;re a seasoned hunter managing applications across seven states, this module gives you the tools to stay organized, make smarter decisions, and spend less time guessing.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Track every application deadline across Colorado, Montana, Wyoming, Idaho, Nevada, Utah, and Arizona. Log field scouting data with GPS-pinned waypoints, auto-stamped weather, and terrain analysis. Generate AI-powered scout reports for any GMU with species behavior, access points, and terrain breakdowns. Plan full expeditions with gear lists, budgets, and hunt party coordination.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          This isn&apos;t a generic outdoor app — it&apos;s purpose-built by hunters who actually apply, scout, and pack into the backcountry. Every feature exists because we needed it ourselves.
        </p>
        <ModuleCta moduleHref="/hunting/my-hunts" moduleName="Hunting" inline />
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What&apos;s Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-amber-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/hunting/my-hunts" moduleName="Hunting" />
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
