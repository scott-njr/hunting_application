import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Dumbbell, Heart, Route, Users,
  Brain, Timer, UtensilsCrossed, Activity,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'
import { WowPreview } from '@/components/fitness/wow-preview'

export const metadata: Metadata = {
  title: 'Fitness Module — AI Coaching & Plans',
  description: 'AI run coaching, strength programming, meal planning, baseline testing, and weekly challenges — all personalized to your goals and built for outdoor performance.',
}

const features = [
  {
    icon: Activity,
    title: 'AI Run Coach',
    description: 'Get a personalized 8-week running program matched to your fitness level and goals. Log sessions, track pace improvements, and adjust your plan as you progress.',
  },
  {
    icon: Dumbbell,
    title: 'AI Strength Coach',
    description: 'Custom 8-week strength programs built around your available equipment and target goals. Session logging, progressive overload, and AI-powered plan adjustments.',
  },
  {
    icon: UtensilsCrossed,
    title: 'AI Meal Prep',
    description: '7-day meal plans with macros, grocery lists, and cost estimates. Swap individual meals, adjust for dietary preferences, and regenerate plans as needed.',
  },
  {
    icon: Heart,
    title: 'Baseline Fitness Test',
    description: 'Military PT-style assessments — 2-mile run, pushups, situps, pullups. Track progress over time with charts and see where you stand.',
  },
  {
    icon: Brain,
    title: 'My Plan Hub',
    description: 'One daily snapshot showing today\'s meals and this week\'s workouts across all your active plans. Everything you need to execute, in one place.',
  },
  {
    icon: Route,
    title: 'Workout of the Week',
    description: 'AI-generated weekly challenges with three scaling levels. Post your score, compete on leaderboards, and hold each other accountable.',
  },
  {
    icon: Timer,
    title: 'Plan Adjustments',
    description: 'Plans not working? Tell the AI what changed — injury, schedule shift, new equipment — and get an adjusted program without starting over.',
  },
  {
    icon: Users,
    title: 'Community & Progress',
    description: 'Share progress updates, gear reviews, and training tips with a fitness-focused community. Module-specific feed keeps content relevant.',
  },
]

const showcases = [
  {
    title: 'Your Daily Game Plan',
    description: 'My Plan pulls together your run training, strength workouts, and meals into a single daily view. No jumping between tabs — just open the app and know exactly what to do today.',
    image: '/images/fitness/my-plan-preview.png',
    alt: 'My Plan daily snapshot showing meals and workouts',
  },
  {
    title: 'AI-Built Training Programs',
    description: 'Tell the AI your goals, timeline, and available equipment. It generates a full 8-week periodized program — whether that\'s a running plan to crush your 2-mile time or a strength program focused on pack-out conditioning. Log every session and track your progress week over week.',
    image: '/images/fitness/ai-coach-preview.png',
    alt: 'AI Run Coach showing an 8-week training plan',
  },
  {
    title: 'Meal Plans That Actually Work',
    description: 'No generic diet templates. The AI builds 7-day meal plans based on your calorie targets, dietary preferences, and budget. Every meal includes macros and prep instructions. Don\'t like a meal? Swap it with one tap and the AI generates a replacement that fits your plan.',
    image: '/images/fitness/meal-prep-preview.png',
    alt: 'AI Meal Prep showing a weekly meal plan with macros',
  },
  {
    title: 'Track Your Baseline',
    description: 'The baseline fitness test gives you a no-BS snapshot of where you stand — 2-mile run, max pushups, situps, and pullups. Retake it monthly and watch your progress charts trend upward. Your profile tracks body composition and strength benchmarks too.',
    image: '/images/fitness/baseline-preview.png',
    alt: 'Baseline fitness test results with progress charts',
  },
]

export default function FitnessPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/exploring/bear_lake.JPG"
            alt="Mountain lake trailhead"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="h-7 w-7 text-green-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Fitness</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-400 mb-4">Built for Real Life</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            AI-powered run coaching, strength programming, meal planning, and baseline testing — personalized to your goals and built for people who perform outdoors.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is the Fitness Module?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Fitness module isn&apos;t another gym app with cookie-cutter programs. It&apos;s a full AI coaching platform that builds personalized run plans, strength programs, and meal plans around your specific goals — whether that&apos;s crushing a mountain hunt at 10,000 feet, finishing a ruck event, or just being harder to kill in everyday life.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Start with a baseline fitness test to see where you stand. Then let the AI coaches build your programs: an 8-week running plan with progressive mileage, a strength program matched to your equipment and goals, and a 7-day meal plan with macros, grocery lists, and per-meal swaps. Everything lands in your My Plan hub — one daily view showing exactly what to eat and what to train.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          Plans aren&apos;t static. When life changes — an injury, a schedule shift, new equipment — tell the AI and it adjusts your program without starting over. Weekly community challenges keep you competitive, and the module-specific feed lets you share progress with people who are actually training, not just talking about it.
        </p>
        <ModuleCta moduleHref="/fitness/my-plan" moduleName="Fitness" inline />
      </div>

      {/* This Week's Challenge */}
      <div className="relative max-w-7xl mx-auto px-8 pb-8">
        <WowPreview />
      </div>
      </section>

      {/* Feature Showcases with Screenshots */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-10">See It in Action</h2>
        <div className="space-y-16">
          {showcases.map(({ title, description, image, alt }, i) => (
            <div
              key={title}
              className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}
            >
              <div className="lg:w-1/2">
                <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{description}</p>
              </div>
              <div className="lg:w-1/2">
                <div className="relative aspect-[16/10] rounded-lg border border-subtle bg-surface overflow-hidden">
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  {/* Fallback overlay when image doesn't exist yet */}
                  <div className="absolute inset-0 flex items-center justify-center bg-elevated/80 backdrop-blur-sm">
                    <p className="text-muted text-xs text-center px-4">Screenshot coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">Everything Inside</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-green-400 mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <ModuleCta moduleHref="/fitness/my-plan" moduleName="Fitness" />
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
