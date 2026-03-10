import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Fish, MapPin, BookOpen, Wrench, Users,
  CloudSun,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'

export const metadata: Metadata = {
  title: 'Fishing Module — Guides & Community',
  description: 'Trip logs, species databases, regulation trackers, gear management, and fly tying resources for freshwater and saltwater anglers at every level.',
}

const features = [
  {
    icon: MapPin,
    title: 'Trip Logs',
    description: 'Log every outing with location, species caught, techniques used, and conditions — build a personal database of what works.',
  },
  {
    icon: BookOpen,
    title: 'Species Database',
    description: 'Identification guides, habitat info, seasonal patterns, and techniques for freshwater and saltwater species.',
  },
  {
    icon: CloudSun,
    title: 'Regulation Tracker',
    description: 'Season dates, bag limits, and special regulations by state and water body — always know the rules before you go.',
  },
  {
    icon: Wrench,
    title: 'Gear Management',
    description: 'Track rods, reels, tackle, and terminal gear. Know what you have, what needs replacing, and what to bring on each trip.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with anglers in your area. Share reports, swap techniques, and find fishing partners for any water type.',
  },
  {
    icon: Fish,
    title: 'Fly Tying Library',
    description: 'Step-by-step patterns, material lists, and seasonal hatch charts — from woolly buggers to match-the-hatch dry flies.',
  },
]

export default function FishingPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/fishing/scott_river_alaska.JPG"
            alt="River fishing in Alaska"
            fill
            className="object-cover"
            style={{ objectPosition: 'center 10%' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Fish className="h-7 w-7 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Fishing</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400 mb-4">Read the Water. Land the Fish.</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Trip logs, species databases, regulation trackers, and gear management for anglers at every level — from your first cast to fly tying mastery.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Fishing Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Fishing module is for anyone who loves being on the water — whether you&apos;re spin casting at a local pond, fly fishing mountain streams, or chasing halibut off the coast of Alaska. It gives you the tools to log, learn, and get better at every style of fishing.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Log every trip with GPS locations, species caught, techniques, and conditions so you can see what works and where. Browse species identification guides with habitat info and seasonal patterns. Stay on top of regulations with state-by-state season dates, bag limits, and special rules. Track all your gear so you always know what you&apos;re bringing and what needs replacing.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          The fishing community connects you with local anglers, helps you find fishing partners, and gives you a place to share trip reports and techniques. Whether you fish for food, sport, or just to get outside — this module is built for you.
        </p>
        <ModuleCta moduleHref="/fishing/my-fishing" moduleName="Fishing" inline />
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

        <ModuleCta moduleHref="/fishing/my-fishing" moduleName="Fishing" />
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
