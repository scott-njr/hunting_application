import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Mountain, Target, Users, Shield, Route,
  Heart,
} from 'lucide-react'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the team behind Praevius — hunters, anglers, and outdoor athletes building the structured training and tools platform they wish existed.',
  alternates: { canonical: '/about' },
}

const values = [
  {
    icon: Target,
    title: 'Built by Practitioners',
    description: 'Every feature exists because we needed it ourselves. We hunt, fish, shoot, and train — and we build the tools we wish existed.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'Praevius is built around the people who use it. Mentors, beginners, and everyone in between — this is your platform.',
  },
  {
    icon: Shield,
    title: 'No Shortcuts',
    description: 'We don\'t cut corners on safety, accuracy, or integrity. If it\'s in the platform, it\'s been verified and field-tested.',
  },
  {
    icon: Route,
    title: 'Meet You Where You Are',
    description: 'Every module is designed for every skill level — from your first day to your thousandth. Progress at your own pace.',
  },
  {
    icon: Heart,
    title: 'Respect the Resource',
    description: 'Conservation, ethical practices, and responsible stewardship are woven into everything we build and teach.',
  },
  {
    icon: Mountain,
    title: 'Always Improving',
    description: 'We ship fast, listen to feedback, and iterate constantly. The platform gets better every week because the community drives it.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>


      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hunting/chad_and_scott_cuchara.JPG"
            alt="Hunters glassing in the mountains"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Mountain className="h-7 w-7 text-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">About Us</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-4">The Team Behind Praevius</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            We&apos;re hunters, anglers, shooters, and outdoor athletes building the platform we wish existed — structured paths, real mentors, and tools that actually work.
          </p>
        </div>

      {/* About */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">Why Praevius Exists</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Praevius was born out of frustration. We spent years bouncing between forums, spreadsheets, YouTube videos, and scattered apps trying to piece together the tools and knowledge we needed to hunt smarter, train harder, and stay prepared. Nothing connected the dots. So we built something that does.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The name Praevius means &quot;leading the way&quot; — and that&apos;s exactly what this platform is designed to do. Whether you&apos;re a first-time hunter trying to understand the draw system, a competitive archer refining your form, or someone who just wants to be more capable in the backcountry, Praevius gives you the structure, tools, and community to get there.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          We&apos;re a small team that punches above our weight. Every module is built by people who actually practice what they teach. We don&apos;t have a marketing department — we have a community. And we think that&apos;s a better foundation to build on.
        </p>
      </div>
      </section>

      {/* Values grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What We Stand For</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {values.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-accent mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
