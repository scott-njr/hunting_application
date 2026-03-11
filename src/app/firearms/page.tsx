import type { Metadata } from 'next'
import {
  Shield, BookOpen, Wrench, Target, Scale,
  ClipboardList,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Firearms Module — Safety & Training',
  description: 'Firearms safety fundamentals, range session tracking, maintenance logs, ballistics data, and state compliance tools for responsible gun owners.',
  alternates: { canonical: '/firearms' },
}

export default createNav2Page({
  hero: {
    icon: Shield,
    colorClass: 'text-blue-400',
    title: 'Firearms — Safety & Maintenance Training',
    tagline: 'Safe, Confident, Competent',
    description: 'From your first purchase to confident handling — safety fundamentals, training logs, maintenance, and state compliance.',
    image: '/images/hunting/chad_and_scott_cuchara.JPG',
    imageAlt: 'Hunters in the field',
  },
  about: {
    heading: 'What is the Firearms Module?',
    paragraphs: [
      'The Firearms module is built for responsible gun owners who want to be safer, more competent, and better organized. Whether you just bought your first rifle or you\u2019ve been shooting for decades, this module gives you the structure and tools to stay sharp and stay legal.',
      'Start with the fundamentals — safe handling, storage best practices, and the four rules that never change. From there, build real skill with structured range session tracking, accuracy logging, and practice plans designed around your goals. Keep your firearms maintained with round-count tracking, cleaning logs, and part replacement schedules.',
      'The compliance tools keep you informed on state-specific laws for transport, storage, and carry — because the rules matter and they change. Whether you shoot for sport, hunt, or carry for protection, this module helps you do it right.',
    ],
  },
  features: [
    { icon: BookOpen, title: 'Safety Fundamentals', description: 'Core safety rules, safe handling practices, and storage requirements — the foundation everything else builds on.' },
    { icon: Target, title: 'Range Session Tracking', description: 'Log your range trips, track accuracy over time, and build structured practice routines that actually improve your shooting.' },
    { icon: Wrench, title: 'Maintenance Logs', description: 'Track round counts, cleaning schedules, and part replacements for every firearm in your collection.' },
    { icon: Scale, title: 'State Compliance', description: 'Stay current on your state\'s laws — transport rules, storage requirements, and carry regulations in one place.' },
    { icon: ClipboardList, title: 'Ballistics & Load Data', description: 'Ballistics calculators, handload recipes, and zero data for your specific setups — organized and accessible.' },
    { icon: Shield, title: 'Training Courses', description: 'Structured learning paths from first-time owners to advanced marksmanship, taught by certified instructors.' },
  ],
  cta: { href: '/firearms/my-firearms', name: 'Firearms', inlineInAbout: true },
})
