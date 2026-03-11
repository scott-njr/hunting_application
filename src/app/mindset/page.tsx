import type { Metadata } from 'next'
import {
  Brain, Target, Shield, Flame, Eye,
  Users,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Mindset Module — Mental Performance',
  description: 'Mental performance training for hunters and athletes — visualization, stress inoculation, focus drills, resilience building, and decision frameworks.',
  alternates: { canonical: '/mindset' },
}

export default createNav2Page({
  hero: {
    icon: Brain,
    colorClass: 'text-purple-400',
    title: 'Mindset',
    tagline: 'Become Who You\u2019re Meant to Be',
    description: 'Mental preparation, focus training, stress management, and resilience — because the hardest part of the field isn\u2019t physical.',
    image: '/images/exploring/bear_lake_2.JPG',
    imageAlt: 'Mountain reflection at golden hour',
  },
  about: {
    heading: 'What is the Mindset Module?',
    paragraphs: [
      'The Mindset module is for anyone who has ever choked on a shot, lost focus on a long sit, or quit on a hard day when they should have pushed through. Physical preparation gets all the attention, but the mental game is what separates good from great — and this module trains it specifically.',
      'Practice pre-hunt visualization to mentally rehearse shot scenarios and stalk approaches before you\u2019re in the moment. Train stress inoculation through progressive exposure drills so your nervous system stays calm when it counts. Build focus with attention control exercises designed for the patience-intensive reality of hunting and shooting. Develop resilience frameworks for the inevitable hard days.',
      'This isn\u2019t motivational fluff — it\u2019s structured mental training drawn from sports psychology, military performance science, and the real-world experience of hunters and athletes who have been there. The edge is mental, and this module sharpens it.',
    ],
  },
  features: [
    { icon: Target, title: 'Pre-Hunt Visualization', description: 'Guided mental rehearsal for shot scenarios, stalk approaches, and high-pressure moments — build confidence before the hunt.' },
    { icon: Shield, title: 'Stress Inoculation', description: 'Train your nervous system to perform under pressure with progressive stress exposure drills and breathing protocols.' },
    { icon: Eye, title: 'Focus Training', description: 'Attention control exercises for long sits, glassing sessions, and maintaining awareness in the field over hours.' },
    { icon: Flame, title: 'Resilience Building', description: 'Mental toughness training for the hard days — bad weather, missed shots, tough pack-outs, and empty tags.' },
    { icon: Brain, title: 'Decision Frameworks', description: 'Structured thinking tools for field decisions — shoot or pass, approach strategy, risk assessment, and ethical judgment calls.' },
    { icon: Users, title: 'Accountability Partners', description: 'Pair up with others who are training their mindset. Set goals, check in weekly, and push each other to grow.' },
  ],
  cta: { href: '/mindset', name: 'Mindset', inlineInAbout: false },
})
