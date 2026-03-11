import type { Metadata } from 'next'
import {
  Crosshair, Calendar, MapPin, Bot, Package, Tent,
  BookOpen, Users,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Hunting Module — AI Draw Strategy & Scouting',
  description: 'AI-powered draw strategy, deadline tracking, field scouting with GPS waypoints, and expedition planning for western big game hunters at every level.',
  alternates: { canonical: '/hunting' },
}

export default createNav2Page({
  hero: {
    icon: Crosshair,
    colorClass: 'text-amber-400',
    title: 'Hunting — AI Draw Strategy & Field Scouting',
    tagline: 'Plan Smarter. Hunt Better.',
    description: 'AI-powered draw strategy, deadline tracking, field scouting, and expedition planning — whether it\u2019s your first tag or your twentieth.',
    image: '/images/hunting/cuchara_main_view.JPG',
    imageAlt: 'Mountain hunting landscape',
  },
  about: {
    heading: 'What is the Hunting Module?',
    paragraphs: [
      'The Hunting module is built for western big game hunters at every experience level. Whether you\u2019re trying to understand the draw system for the first time or you\u2019re a seasoned hunter managing applications across seven states, this module gives you the tools to stay organized, make smarter decisions, and spend less time guessing.',
      'Track every application deadline across Colorado, Montana, Wyoming, Idaho, Nevada, Utah, and Arizona. Log field scouting data with GPS-pinned waypoints, auto-stamped weather, and terrain analysis. Generate AI-powered scout reports for any GMU with species behavior, access points, and terrain breakdowns. Plan full expeditions with gear lists, budgets, and hunt party coordination.',
      'This isn\u2019t a generic outdoor app — it\u2019s purpose-built by hunters who actually apply, scout, and pack into the backcountry. Every feature exists because we needed it ourselves.',
    ],
  },
  features: [
    { icon: Calendar, title: 'Deadline Tracker', description: 'Every application window, payment deadline, and results date for western states — tracked automatically.' },
    { icon: MapPin, title: 'Scout', description: 'Pin sightings, sign, and waypoints on topo maps with auto-stamped weather conditions.' },
    { icon: Bot, title: 'AI Scout Reports', description: 'Get AI-generated scouting intel for any GMU — terrain, access, species behavior, and more.' },
    { icon: Tent, title: 'Hunt Plans', description: 'Plan trips with gear lists, budgets, hunt party, and multiple scout locations per trip.' },
    { icon: Package, title: 'Gear Checklist', description: 'Track your gear across 150+ items. Know what you have and what you still need.' },
    { icon: BookOpen, title: 'Courses', description: 'Draw strategy, unit scouting, field skills. Learn from people who actually do this.' },
    { icon: Users, title: 'Community', description: 'Find hunting buddies in your area, get matched with mentors, and connect with hunters who share your interests.' },
  ],
  cta: { href: '/hunting/my-hunts', name: 'Hunting', inlineInAbout: true },
})
