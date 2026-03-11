import type { Metadata } from 'next'
import {
  Target, GraduationCap, Users, Ruler, Trophy,
  Video,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Archery Module — Training & Community',
  description: 'Structured archery training from beginner to competitive. Bow setup guides, form coaching, shot tracking, and a community of archers at every level.',
  alternates: { canonical: '/archery' },
}

export default createNav2Page({
  hero: {
    icon: Target,
    colorClass: 'text-teal-400',
    title: 'Archery — Training, Tuning & Community',
    tagline: 'Aim True. Shoot Often.',
    description: 'From your first bow to competitive shooting and bowhunting — structured training, equipment guides, form coaching, and a community of archers at every level.',
    image: '/images/hunting/on_the_hunt.JPG',
    imageAlt: 'Bowhunting in the field',
  },
  about: {
    heading: 'What is the Archery Module?',
    paragraphs: [
      'The Archery module is designed for anyone who picks up a bow — whether you\u2019re shooting in your backyard for the first time, preparing for your first 3D competition, or fine-tuning form for bowhunting season. We break archery down into real, structured learning paths that meet you where you are.',
      'Learn proper shooting form through video breakdowns and drill progressions. Get step-by-step bow setup and tuning guides for compound, recurve, and traditional bows. Track your practice sessions, log arrow groups, and measure improvement over time. Prepare for competitions with course strategy, mental game coaching, and tournament breakdowns.',
      'The archery community connects you with shooters at every level — share gear reviews, find local shoots, get coaching recommendations, and connect with partners who push you to get better. Whether you shoot targets or hunt with a bow, this module has something for you.',
    ],
  },
  features: [
    { icon: GraduationCap, title: 'Courses', description: 'Structured training from beginner to competitive. Form coaching, equipment guides, and drills.' },
    { icon: Users, title: 'Community', description: 'Connect with archers at every level. Gear reviews, competition reports, and coaching tips.' },
    { icon: Ruler, title: 'Bow Setup & Tuning', description: 'Step-by-step guides for paper tuning, walk-back tuning, sight tapes, and arrow selection.' },
    { icon: Trophy, title: 'Competition Prep', description: '3D courses, indoor leagues, and tournament strategy — from local shoots to national events.' },
    { icon: Video, title: 'Form Analysis', description: 'Video breakdowns, anchor point drills, and shot execution fundamentals from experienced coaches.' },
    { icon: Target, title: 'Shot Trainer', description: 'Log sessions, track groups, and measure improvement over time with structured practice plans.' },
  ],
  cta: { href: '/archery/my-archery', name: 'Archery', inlineInAbout: true },
})
