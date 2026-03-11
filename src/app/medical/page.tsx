import type { Metadata } from 'next'
import {
  Heart, AlertTriangle, BookOpen, Package, MapPin,
  Radio,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'Wilderness Medical Training',
  description: 'Wilderness first aid protocols, emergency preparedness, medical kit building, evacuation planning, and CPR refreshers for backcountry safety.',
  alternates: { canonical: '/medical' },
}

export default createNav2Page({
  hero: {
    icon: Heart,
    colorClass: 'text-red-400',
    title: 'Medical — Wilderness First Aid Training',
    tagline: 'Be Ready When It Matters',
    description: 'Wilderness first aid protocols, emergency preparedness, and backcountry safety — because the field doesn\u2019t have a 911.',
    image: '/images/exploring/gabe_pilot.JPG',
    imageAlt: 'Backcountry aviation and remote access',
  },
  about: {
    heading: 'What is the Medical Module?',
    paragraphs: [
      'The Medical module is for anyone who spends time in places where help isn\u2019t coming fast. Whether you\u2019re hunting elk in a wilderness area, fishing a remote river, or camping with your family miles from the nearest road — knowing what to do in an emergency isn\u2019t optional. It\u2019s essential.',
      'Learn wilderness first aid through structured courses that cover patient assessment, wound management, and improvised treatment. Build customized medical kits based on your specific trip parameters. Pre-plan evacuation routes and communication protocols before you leave cell service. Refresh your CPR and bleeding control skills with video-guided training you can do anywhere.',
      'This module isn\u2019t about replacing professional medical training — it\u2019s about making sure you have the knowledge and equipment to keep someone alive until professional help arrives. The backcountry is unforgiving, and preparation is the difference between a close call and a tragedy.',
    ],
  },
  features: [
    { icon: AlertTriangle, title: 'Emergency Protocols', description: 'Step-by-step guides for common backcountry emergencies — bleeding control, fractures, hypothermia, and snakebite.' },
    { icon: BookOpen, title: 'Wilderness First Aid', description: 'Structured courses covering patient assessment, wound care, and improvised treatment when help is hours away.' },
    { icon: Package, title: 'Medical Kit Builder', description: 'Customized kit lists based on trip length, group size, and terrain — know exactly what to pack and how to use it.' },
    { icon: MapPin, title: 'Evacuation Planning', description: 'Pre-trip evacuation route mapping, nearest hospital waypoints, and emergency contact protocols for remote areas.' },
    { icon: Radio, title: 'Communication Plans', description: 'SAT device setup guides, check-in schedules, and emergency signal procedures for when cell service doesn\'t exist.' },
    { icon: Heart, title: 'CPR & AED Training', description: 'Video-guided refreshers on life-saving basics — because certifications expire but emergencies don\'t wait.' },
  ],
  cta: { href: '/medical/my-medical', name: 'Medical', inlineInAbout: true },
})
