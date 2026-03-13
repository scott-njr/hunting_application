import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import Link from 'next/link'
import {
  LayoutDashboard, Crosshair, Target, Shield, Heart, Fish, Dumbbell,
  Calendar, BarChart3, BookOpen, Users, Bot, MapPin, ArrowRight,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Command Center — Your Central Hub',
  description: 'Your command center for all Lead the Wild modules — hunting, archery, firearms, fishing, fitness, and medical. Track progress, manage plans, and access every tool from one place.',
}

const modules = [
  {
    icon: Crosshair,
    name: 'Hunting',
    tagline: 'Plan Smarter. Hunt Better.',
    description: 'Draw deadlines, AI scout reports, field map, hunt planning, and gear tracking for western big game.',
    href: '/hunting',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-900/20',
    border: 'border-amber-800/30',
  },
  {
    icon: Target,
    name: 'Archery',
    tagline: 'Aim True. Shoot Often.',
    description: 'Courses, community, and training plans for bowhunters and target archers at every level.',
    href: '/archery',
    accent: 'text-teal-400',
    iconBg: 'bg-teal-900/20',
    border: 'border-teal-800/30',
  },
  {
    icon: Shield,
    name: 'Firearms',
    tagline: 'Safe, Confident, Competent',
    description: 'Safety fundamentals, training logs, maintenance tracking, and state compliance resources.',
    href: '/firearms',
    accent: 'text-blue-400',
    iconBg: 'bg-blue-900/20',
    border: 'border-blue-800/30',
  },
  {
    icon: Dumbbell,
    name: 'Fitness',
    tagline: 'Built for Real Life',
    description: 'AI coaching for running, strength, and meal prep. Baseline testing, weekly challenges, and progress tracking.',
    href: '/fitness',
    accent: 'text-green-400',
    iconBg: 'bg-green-900/20',
    border: 'border-green-800/30',
  },
  {
    icon: Fish,
    name: 'Fishing',
    tagline: 'Read the Water. Land the Fish.',
    description: 'Species guides, water reading, gear selection, and a community of anglers sharing what works.',
    href: '/fishing',
    accent: 'text-cyan-400',
    iconBg: 'bg-cyan-900/20',
    border: 'border-cyan-800/30',
  },
  {
    icon: Heart,
    name: 'Medical',
    tagline: 'Be Ready When It Matters',
    description: 'Wilderness first aid, trauma response, and backcountry medical protocols for when help is hours away.',
    href: '/medical',
    accent: 'text-red-400',
    iconBg: 'bg-red-900/20',
    border: 'border-red-800/30',
  },
]

const dashboardFeatures = [
  {
    icon: Calendar,
    title: 'Weekly Preview',
    description: 'See your entire week at a glance — meals, workouts, hunt trips, and deadlines all in one calendar view.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Track course completion, fitness gains, AI usage, and activity across every module you subscribe to.',
  },
  {
    icon: Bot,
    title: 'AI Tools',
    description: 'AI-powered coaching, scout reports, and meal planning — all accessible from your command center with quota tracking.',
  },
  {
    icon: BookOpen,
    title: 'Course Library',
    description: 'Structured courses across every module — from beginner fundamentals to advanced strategy and technique.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Module-specific feeds, direct messaging, friend connections, and shared workout plans.',
  },
  {
    icon: MapPin,
    title: 'Field Tools',
    description: 'GPS field map, scouting pins, weather data, terrain analysis, and expedition planning tools.',
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/gabe_pilot.JPG"
            alt="Overlooking wilderness terrain"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-7 w-7 text-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Command Center</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-4">Your Central Hub</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            One place to manage everything — your modules, courses, fitness plans, community, and AI tools.
            The command center is your home base across all of Lead the Wild.
          </p>
        </div>

        {/* About */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <h2 className="text-2xl font-bold text-primary mb-3">Everything in One Place</h2>
          <p className="text-secondary text-sm leading-relaxed mb-4">
            The Command Center is your central hub for the entire Lead the Wild platform. Instead of jumping between separate apps for hunting, fitness, medical training, and more — everything lives here. See your weekly schedule, track progress across modules, manage AI-powered coaching plans, and stay connected with your community.
          </p>
          <p className="text-secondary text-sm leading-relaxed mb-4">
            Your command center adapts to the modules you subscribe to. Subscribe to Hunting and you&apos;ll see upcoming draw deadlines and trip plans. Add Fitness and your weekly meals and workouts appear in the calendar. Every module you activate adds its tools and data to your personalized command center.
          </p>
          <p className="text-secondary text-sm leading-relaxed">
            Whether you&apos;re managing one module or all six, the command center keeps you organized, on track, and focused on what matters — getting better at the things you care about.
          </p>
          <ModuleCta moduleHref="/home" moduleName="Command Center" inline />
        </div>
      </section>

      {/* Dashboard Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What You Get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {dashboardFeatures.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-accent mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Module Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16 border-t border-subtle pt-16">
        <h2 className="text-xl font-bold text-primary mb-2">Available Modules</h2>
        <p className="text-secondary text-sm mb-8">
          Each module adds specialized tools and content to your command center. Subscribe to the ones that match your interests.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {modules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.name}
                href={mod.href}
                className={`bg-surface border ${mod.border} rounded-xl p-5 hover:border-default transition-colors group`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${mod.iconBg} rounded-lg p-2.5`}>
                    <Icon className={`h-5 w-5 ${mod.accent}`} />
                  </div>
                  <div>
                    <h3 className="text-primary font-semibold text-sm">{mod.name}</h3>
                    <p className={`text-xs font-medium ${mod.accent}`}>{mod.tagline}</p>
                  </div>
                </div>
                <p className="text-muted text-xs leading-relaxed mb-3">{mod.description}</p>
                <span className="text-accent text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            )
          })}
        </div>

        <ModuleCta moduleHref="/home" moduleName="Command Center" />
      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
