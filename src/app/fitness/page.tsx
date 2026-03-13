import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Dumbbell, Heart, Route, Users,
  Brain, Timer, UtensilsCrossed, Activity,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'
import { WowPreview } from '@/components/fitness/wow-preview'

export const metadata: Metadata = {
  title: 'Fitness Module — AI Coaching & Plans',
  description: 'AI run coaching, strength programming, meal planning, baseline testing, and weekly challenges — all personalized to your goals and built for outdoor performance.',
  alternates: { canonical: '/fitness' },
}

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
    description: 'No generic diet templates. The AI builds 8-week meal plans based on your calorie targets, dietary preferences, and budget. Every meal includes macros and prep instructions. Don\'t like a meal? Swap it with one tap and the AI generates a replacement that fits your plan.',
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

function FitnessExtraContent() {
  return (
    <>
      {/* This Week's Challenge */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pb-8">
        <WowPreview />
      </div>

      {/* Feature Showcases with Screenshots */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
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
                  <div className="absolute inset-0 bg-elevated/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default createNav2Page({
  hero: {
    icon: Dumbbell,
    colorClass: 'text-green-400',
    title: 'Fitness — AI Coaching & Meal Plans',
    tagline: 'Built for Real Life',
    description: 'AI-powered run coaching, strength programming, meal planning, and baseline testing — personalized to your goals and built for people who perform outdoors.',
    image: '/images/exploring/bear_lake.JPG',
    imageAlt: 'Mountain lake trailhead',
  },
  about: {
    heading: 'What is the Fitness Module?',
    paragraphs: [
      'The Fitness module isn\u2019t another gym app with cookie-cutter programs. It\u2019s a full AI coaching platform that builds personalized run plans, strength programs, and meal plans around your specific goals — whether that\u2019s crushing a mountain hunt at 10,000 feet, finishing a ruck event, or just being harder to kill in everyday life.',
      'Start with a baseline fitness test to see where you stand. Then let the AI coaches build your programs: an 8-week running plan with progressive mileage, a strength program matched to your equipment and goals, and an 8-week meal plan with macros, grocery lists, and per-meal swaps. Everything lands in your My Plan hub — one daily view showing exactly what to eat and what to train.',
      'Plans aren\u2019t static. When life changes — an injury, a schedule shift, new equipment — tell the AI and it adjusts your program without starting over. Weekly community challenges keep you competitive, and the module-specific feed lets you share progress with people who are actually training, not just talking about it.',
    ],
  },
  features: [
    { icon: Activity, title: 'AI Run Coach', description: 'Get a personalized 8-week running program matched to your fitness level and goals. Log sessions, track pace improvements, and adjust your plan as you progress.' },
    { icon: Dumbbell, title: 'AI Strength Coach', description: 'Custom 8-week strength programs built around your available equipment and target goals. Session logging, progressive overload, and AI-powered plan adjustments.' },
    { icon: UtensilsCrossed, title: 'AI Meal Prep', description: '8-week meal plans with macros, grocery lists, and cost estimates. Swap individual meals, adjust for dietary preferences, and regenerate plans as needed.' },
    { icon: Heart, title: 'Baseline Fitness Test', description: 'Military PT-style assessments — 2-mile run, pushups, situps, pullups. Track progress over time with charts and see where you stand.' },
    { icon: Brain, title: 'My Plan Hub', description: 'One daily snapshot showing today\'s meals and this week\'s workouts across all your active plans. Everything you need to execute, in one place.' },
    { icon: Route, title: 'Workout of the Week', description: 'AI-generated weekly challenges with three scaling levels. Post your score, compete on leaderboards, and hold each other accountable.' },
    { icon: Timer, title: 'Plan Adjustments', description: 'Plans not working? Tell the AI what changed — injury, schedule shift, new equipment — and get an adjusted program without starting over.' },
    { icon: Users, title: 'Community & Progress', description: 'Share progress updates, gear reviews, and training tips with a fitness-focused community. Module-specific feed keeps content relevant.' },
  ],
  cta: { href: '/fitness/my-plan', name: 'Fitness', inlineInAbout: true },
  featuresHeading: 'Everything Inside',
  extraContent: <FitnessExtraContent />,
})
