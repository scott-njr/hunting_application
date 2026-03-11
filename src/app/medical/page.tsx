import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Heart, AlertTriangle, BookOpen, Package, MapPin,
  Radio,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Wilderness Medical Training',
  description: 'Wilderness first aid protocols, emergency preparedness, medical kit building, evacuation planning, and CPR refreshers for backcountry safety.',
  alternates: { canonical: '/medical' },
}

const features = [
  {
    icon: AlertTriangle,
    title: 'Emergency Protocols',
    description: 'Step-by-step guides for common backcountry emergencies — bleeding control, fractures, hypothermia, and snakebite.',
  },
  {
    icon: BookOpen,
    title: 'Wilderness First Aid',
    description: 'Structured courses covering patient assessment, wound care, and improvised treatment when help is hours away.',
  },
  {
    icon: Package,
    title: 'Medical Kit Builder',
    description: 'Customized kit lists based on trip length, group size, and terrain — know exactly what to pack and how to use it.',
  },
  {
    icon: MapPin,
    title: 'Evacuation Planning',
    description: 'Pre-trip evacuation route mapping, nearest hospital waypoints, and emergency contact protocols for remote areas.',
  },
  {
    icon: Radio,
    title: 'Communication Plans',
    description: 'SAT device setup guides, check-in schedules, and emergency signal procedures for when cell service doesn\'t exist.',
  },
  {
    icon: Heart,
    title: 'CPR & AED Training',
    description: 'Video-guided refreshers on life-saving basics — because certifications expire but emergencies don\'t wait.',
  },
]

export default function MedicalPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/gabe_pilot.JPG"
            alt="Backcountry aviation and remote access"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-7 w-7 text-red-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Medical — Wilderness First Aid Training</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-400 mb-4">Be Ready When It Matters</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Wilderness first aid protocols, emergency preparedness, and backcountry safety — because the field doesn&apos;t have a 911.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Medical Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Medical module is for anyone who spends time in places where help isn&apos;t coming fast. Whether you&apos;re hunting elk in a wilderness area, fishing a remote river, or camping with your family miles from the nearest road — knowing what to do in an emergency isn&apos;t optional. It&apos;s essential.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Learn wilderness first aid through structured courses that cover patient assessment, wound management, and improvised treatment. Build customized medical kits based on your specific trip parameters. Pre-plan evacuation routes and communication protocols before you leave cell service. Refresh your CPR and bleeding control skills with video-guided training you can do anywhere.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          This module isn&apos;t about replacing professional medical training — it&apos;s about making sure you have the knowledge and equipment to keep someone alive until professional help arrives. The backcountry is unforgiving, and preparation is the difference between a close call and a tragedy.
        </p>
        <ModuleCta moduleHref="/medical/my-medical" moduleName="Medical" inline />
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What&apos;s Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-red-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/medical/my-medical" moduleName="Medical" />
      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
