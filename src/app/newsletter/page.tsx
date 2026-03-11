import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Mail, Calendar, TrendingUp, Package, Bell,
  Newspaper,
} from 'lucide-react'
import { AuthCtaButton } from '@/components/ui/auth-cta-button'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Weekly updates on draw deadlines, gear drops, strategy tips, featured articles, and community highlights delivered straight to your inbox.',
  alternates: { canonical: '/newsletter' },
}

const features = [
  {
    icon: Calendar,
    title: 'Deadline Alerts',
    description: 'Never miss an application window — get reminders for every western state draw deadline before it closes.',
  },
  {
    icon: TrendingUp,
    title: 'Draw Strategy Tips',
    description: 'Weekly insights on point strategies, odds shifts, and application timing to help you make smarter decisions.',
  },
  {
    icon: Package,
    title: 'Gear Drops',
    description: 'New gear announcements, seasonal sales, and honest first-look reviews from the team and community.',
  },
  {
    icon: Newspaper,
    title: 'Featured Articles',
    description: 'The best new content from the blog — field reports, how-to guides, and scouting breakdowns delivered to your inbox.',
  },
  {
    icon: Bell,
    title: 'Platform Updates',
    description: 'New module launches, feature releases, and community events — be the first to know what\'s new on Praevius.',
  },
  {
    icon: Mail,
    title: 'Community Highlights',
    description: 'Standout posts, trip reports, and member achievements from across the Praevius community each week.',
  },
]

export default function NewsletterPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>


      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hunting/cuchara_main_view.JPG"
            alt="Mountain vista"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-7 w-7 text-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">Newsletter</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent mb-4">Stay in the Loop</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Weekly updates on draw deadlines, gear drops, strategy tips, and the best content from the Praevius community.
          </p>
        </div>

      {/* About */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What&apos;s in the Newsletter?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Praevius newsletter is a weekly digest built for people who take the outdoors seriously. We cut through the noise and deliver the information that actually matters — upcoming deadlines, strategy insights, new gear worth looking at, and the best content from our community.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Every issue includes draw deadline reminders so you never miss an application window, plus data-driven strategy tips on point accumulation and odds analysis. We highlight new gear releases with honest takes, share the top blog articles and field reports from the week, and keep you posted on new features and modules launching on the platform.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          No spam, no filler — just the stuff you need to stay sharp, stay informed, and stay ahead. One email per week, easy to unsubscribe anytime.
        </p>
      </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-8 pb-16">
        <h2 className="text-xl font-bold text-primary mb-6">What You&apos;ll Get</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {features.map(({ icon: FIcon, title, description }) => (
            <div key={title} className="glass-card border border-subtle rounded-lg p-5">
              <FIcon className="h-5 w-5 text-accent mb-2" />
              <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
              <p className="text-muted text-xs">{description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <AuthCtaButton view="signup" className="btn-primary inline-flex items-center gap-2 text-sm rounded-full px-8 py-2.5 font-semibold">
            <Mail className="h-4 w-4" /> Subscribe Now
          </AuthCtaButton>
          <p className="text-muted text-xs mt-3">Free for all members. One email per week, unsubscribe anytime.</p>
        </div>
      </section>

      </main>
      <PublicFooter />
    </div>
  )
}
