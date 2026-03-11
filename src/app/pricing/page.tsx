import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import { CheckCircle, X } from 'lucide-react'
import { TierCards } from '@/components/pricing/tier-cards'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Pricing — Plans & Features',
  description: 'Free, Pro, and Pro+ plans for each Lead the Wild module. AI coaching, courses, community, field tools, and more. Subscribe per module — only pay for what you use.',
  alternates: { canonical: '/pricing' },
}

const tierNames = ['Free', 'Pro', 'Pro+']

type Availability = boolean | string

const featureMatrix: { feature: string; values: Availability[] }[] = [
  {
    feature: 'Module tools & trackers',
    values: [true, true, true],
  },
  {
    feature: 'Core content library',
    values: [true, true, true],
  },
  {
    feature: 'AI assistant queries / month',
    values: ['0', '25', '75'],
  },
  {
    feature: 'Progress tracking & analytics',
    values: [false, true, true],
  },
  {
    feature: 'Course library access',
    values: [false, true, true],
  },
  {
    feature: 'Member community',
    values: [false, true, true],
  },
  {
    feature: 'All courses (including advanced)',
    values: [false, false, true],
  },
  {
    feature: 'Personalized AI coaching',
    values: [false, false, true],
  },
]

function FeatureCell({ value }: { value: Availability }) {
  if (value === true) return <CheckCircle className="h-4 w-4 text-accent-hover mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-muted mx-auto" />
  return <span className="text-secondary text-sm">{value}</span>
}

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">Simple pricing. No surprises.</h1>
          <p className="text-secondary">
            Subscribe per module. Only pay for what you use. Cancel anytime.
          </p>
        </div>

        {/* Per-module tier selection */}
        <Suspense fallback={<div className="h-64 animate-pulse bg-elevated rounded-lg" />}>
          <TierCards />
        </Suspense>

        {/* Feature comparison table */}
        <div className="glass-card rounded-lg overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-4 border-b border-subtle min-w-[600px]">
            <div className="p-4 text-muted text-sm font-medium">Feature</div>
            {tierNames.map((name) => (
              <div key={name} className="p-4 text-center text-primary text-sm font-semibold">
                {name}
              </div>
            ))}
          </div>
          {featureMatrix.map(({ feature, values }, i) => (
            <div
              key={feature}
              className={`grid grid-cols-4 min-w-[600px] ${i < featureMatrix.length - 1 ? 'border-b border-subtle' : ''}`}
            >
              <div className="p-4 text-secondary text-sm">{feature}</div>
              {values.map((val, j) => (
                <div key={j} className="p-4 flex items-center justify-center">
                  <FeatureCell value={val} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="text-muted text-xs text-center mt-8">
          Pricing applies per module. Cancel anytime from your account settings.
          Prices in USD. AI features provide guidance only — always verify through official sources.
        </p>
      </main>

      <PublicFooter />
    </div>
  )
}
