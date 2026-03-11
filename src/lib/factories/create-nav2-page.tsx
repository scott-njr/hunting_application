import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import { ModuleCta } from '@/components/ui/module-cta'
import { PublicFooter } from '@/components/layout/public-footer'
import type { LucideIcon } from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
}

type Nav2PageConfig = {
  hero: {
    icon: LucideIcon
    /** Full Tailwind text color class, e.g. 'text-amber-400' */
    colorClass: string
    title: string
    tagline: string
    description: string
    image: string
    imageAlt: string
    imagePosition?: string
  }
  about: {
    heading: string
    paragraphs: string[]
  }
  features: Feature[]
  cta: {
    href: string
    name: string
    inlineInAbout?: boolean
  }
  featuresHeading?: string
  extraContent?: React.ReactNode
}

export function createNav2Page(config: Nav2PageConfig) {
  const {
    hero,
    about,
    features,
    cta,
    featuresHeading = 'What\u2019s Inside',
    extraContent,
  } = config

  const HeroIcon = hero.icon

  return function Nav2Page() {
    return (
      <div className="min-h-dvh bg-base text-primary">
        <Navbar />
        <Nav2 />
        <main>

        {/* Hero with background image */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={hero.image}
              alt={hero.imageAlt}
              fill
              className="object-cover"
              style={hero.imagePosition ? { objectPosition: hero.imagePosition } : undefined}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
            <div className="flex items-center gap-3 mb-2">
              <HeroIcon className={`h-7 w-7 ${hero.colorClass}`} />
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-primary">{hero.title}</h1>
            </div>
            <p className={`text-sm font-semibold uppercase tracking-wide ${hero.colorClass} mb-4`}>{hero.tagline}</p>
            <p className="text-secondary text-lg max-w-2xl mb-0">
              {hero.description}
            </p>
          </div>

        {/* About the Module */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16">
          <h2 className="text-2xl font-bold text-primary mb-3">{about.heading}</h2>
          {about.paragraphs.map((para, i) => (
            <p
              key={i}
              className={`text-secondary text-sm leading-relaxed ${i < about.paragraphs.length - 1 ? 'mb-4' : ''}`}
            >
              {para}
            </p>
          ))}
          {cta.inlineInAbout && (
            <ModuleCta moduleHref={cta.href} moduleName={cta.name} inline />
          )}
        </div>

        {extraContent}
        </section>

        {/* Features grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          <h2 className="text-xl font-bold text-primary mb-6">{featuresHeading}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {features.map(({ icon: FIcon, title, description }) => (
              <div key={title} className="glass-card border border-subtle rounded-lg p-5">
                <FIcon className={`h-5 w-5 ${hero.colorClass} mb-2`} />
                <h3 className="text-primary font-semibold text-sm mb-1">{title}</h3>
                <p className="text-muted text-xs">{description}</p>
              </div>
            ))}
          </div>

          {!cta.inlineInAbout && (
            <ModuleCta moduleHref={cta.href} moduleName={cta.name} />
          )}
        </section>

        </main>
        <PublicFooter />
      </div>
    )
  }
}

export type { Nav2PageConfig }
