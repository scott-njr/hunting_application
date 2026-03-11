import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Fish, Waves, BookOpen, MapPin, Users,
  Compass,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Spearfishing Module',
  description: 'Dive logs, species identification, regulation tracking, spot mapping, and gear management for freedivers and spearfishing enthusiasts at every level.',
  alternates: { canonical: '/spearfishing' },
}

const features = [
  {
    icon: Waves,
    title: 'Dive Logs',
    description: 'Log every dive with depth, visibility, water temp, species encountered, and GPS coordinates for your best spots.',
  },
  {
    icon: BookOpen,
    title: 'Species Database',
    description: 'Identification guides for game fish — habitat, behavior patterns, legal size limits, and best approach techniques.',
  },
  {
    icon: MapPin,
    title: 'Spot Tracking',
    description: 'Pin your dive sites with conditions, access notes, and catch history — build a private database of proven locations.',
  },
  {
    icon: Compass,
    title: 'Regulation Tracker',
    description: 'State and federal regulations, marine protected areas, seasonal closures, and bag limits — always dive legal.',
  },
  {
    icon: Fish,
    title: 'Gear Management',
    description: 'Track spearguns, wetsuits, fins, and accessories. Log maintenance, replacements, and what works in different conditions.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with divers in your area. Share reports, find dive buddies, and learn from experienced spearos.',
  },
]

export default function SpearfishingPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/fishing/homer_raft_fishing.JPG"
            alt="Ocean fishing"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Fish className="h-7 w-7 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Spearfishing</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400 mb-4">Dive Deep. Spear True.</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Dive logs, species identification, regulation tracking, and gear management for spearfishing at every level — from shore dives to blue water hunting.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Spearfishing Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Spearfishing module is built for freedivers and scuba spearos who want to track their dives, learn new species, and connect with the community. Whether you&apos;re hunting kelp beds off the California coast, reef fish in the Caribbean, or pelagics in blue water — this module gives you the tools to dive smarter and more safely.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Log every dive with detailed conditions — depth, visibility, water temperature, current, and species encountered. Build a private database of your best dive sites with GPS pins, access notes, and catch history. Stay on top of regulations with marine protected area maps, seasonal closures, and species-specific bag limits for your region.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          The spearfishing community connects you with local divers, helps you find dive buddies for safety, and gives you a place to share underwater footage and trip reports. Spearfishing is one of the most sustainable forms of harvesting — and this module helps you do it responsibly.
        </p>
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What&apos;s Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-cyan-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/auth/signup" moduleName="Spearfishing" />
      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
