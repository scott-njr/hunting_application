import type { Metadata } from 'next'
import {
  Fish, MapPin, BookOpen, Wrench, Users,
  CloudSun,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Fishing Module — Guides & Community',
  description: 'Trip logs, species databases, regulation trackers, gear management, and fly tying resources for freshwater and saltwater anglers at every level.',
  alternates: { canonical: '/fishing' },
}

export default createNav2Page({
  hero: {
    icon: Fish,
    colorClass: 'text-cyan-400',
    title: 'Fishing — Trip Planning & Species Guides',
    tagline: 'Read the Water. Land the Fish.',
    description: 'Trip logs, species databases, regulation trackers, and gear management for anglers at every level — from your first cast to fly tying mastery.',
    image: '/images/fishing/scott_river_alaska.JPG',
    imageAlt: 'River fishing in Alaska',
    imagePosition: 'center 10%',
  },
  about: {
    heading: 'What is the Fishing Module?',
    paragraphs: [
      'The Fishing module is for anyone who loves being on the water — whether you\u2019re spin casting at a local pond, fly fishing mountain streams, or chasing halibut off the coast of Alaska. It gives you the tools to log, learn, and get better at every style of fishing.',
      'Log every trip with GPS locations, species caught, techniques, and conditions so you can see what works and where. Browse species identification guides with habitat info and seasonal patterns. Stay on top of regulations with state-by-state season dates, bag limits, and special rules. Track all your gear so you always know what you\u2019re bringing and what needs replacing.',
      'The fishing community connects you with local anglers, helps you find fishing partners, and gives you a place to share trip reports and techniques. Whether you fish for food, sport, or just to get outside — this module is built for you.',
    ],
  },
  features: [
    { icon: MapPin, title: 'Trip Logs', description: 'Log every outing with location, species caught, techniques used, and conditions — build a personal database of what works.' },
    { icon: BookOpen, title: 'Species Database', description: 'Identification guides, habitat info, seasonal patterns, and techniques for freshwater and saltwater species.' },
    { icon: CloudSun, title: 'Regulation Tracker', description: 'Season dates, bag limits, and special regulations by state and water body — always know the rules before you go.' },
    { icon: Wrench, title: 'Gear Management', description: 'Track rods, reels, tackle, and terminal gear. Know what you have, what needs replacing, and what to bring on each trip.' },
    { icon: Users, title: 'Community', description: 'Connect with anglers in your area. Share reports, swap techniques, and find fishing partners for any water type.' },
    { icon: Fish, title: 'Fly Tying Library', description: 'Step-by-step patterns, material lists, and seasonal hatch charts — from woolly buggers to match-the-hatch dry flies.' },
  ],
  cta: { href: '/fishing/my-fishing', name: 'Fishing', inlineInAbout: true },
})
