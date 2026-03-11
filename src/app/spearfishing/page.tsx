import type { Metadata } from 'next'
import {
  Fish, Waves, BookOpen, MapPin, Users,
  Compass,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Spearfishing Module',
  description: 'Dive logs, species identification, regulation tracking, spot mapping, and gear management for freedivers and spearfishing enthusiasts at every level.',
  alternates: { canonical: '/spearfishing' },
}

export default createNav2Page({
  hero: {
    icon: Fish,
    colorClass: 'text-cyan-400',
    title: 'Spearfishing',
    tagline: 'Dive Deep. Spear True.',
    description: 'Dive logs, species identification, regulation tracking, and gear management for spearfishing at every level — from shore dives to blue water hunting.',
    image: '/images/fishing/homer_raft_fishing.JPG',
    imageAlt: 'Ocean fishing',
  },
  about: {
    heading: 'What is the Spearfishing Module?',
    paragraphs: [
      'The Spearfishing module is built for freedivers and scuba spearos who want to track their dives, learn new species, and connect with the community. Whether you\u2019re hunting kelp beds off the California coast, reef fish in the Caribbean, or pelagics in blue water — this module gives you the tools to dive smarter and more safely.',
      'Log every dive with detailed conditions — depth, visibility, water temperature, current, and species encountered. Build a private database of your best dive sites with GPS pins, access notes, and catch history. Stay on top of regulations with marine protected area maps, seasonal closures, and species-specific bag limits for your region.',
      'The spearfishing community connects you with local divers, helps you find dive buddies for safety, and gives you a place to share underwater footage and trip reports. Spearfishing is one of the most sustainable forms of harvesting — and this module helps you do it responsibly.',
    ],
  },
  features: [
    { icon: Waves, title: 'Dive Logs', description: 'Log every dive with depth, visibility, water temp, species encountered, and GPS coordinates for your best spots.' },
    { icon: BookOpen, title: 'Species Database', description: 'Identification guides for game fish — habitat, behavior patterns, legal size limits, and best approach techniques.' },
    { icon: MapPin, title: 'Spot Tracking', description: 'Pin your dive sites with conditions, access notes, and catch history — build a private database of proven locations.' },
    { icon: Compass, title: 'Regulation Tracker', description: 'State and federal regulations, marine protected areas, seasonal closures, and bag limits — always dive legal.' },
    { icon: Fish, title: 'Gear Management', description: 'Track spearguns, wetsuits, fins, and accessories. Log maintenance, replacements, and what works in different conditions.' },
    { icon: Users, title: 'Community', description: 'Connect with divers in your area. Share reports, find dive buddies, and learn from experienced spearos.' },
  ],
  cta: { href: '/spearfishing', name: 'Spearfishing', inlineInAbout: false },
})
