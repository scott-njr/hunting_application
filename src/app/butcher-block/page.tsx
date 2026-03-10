import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import Image from 'next/image'
import {
  Beef, BookOpen, Scissors, Thermometer, UtensilsCrossed,
  ClipboardList,
} from 'lucide-react'
import { ModuleCta } from '@/components/ui/module-cta'

export const metadata: Metadata = {
  title: 'The Butcher Block — Field to Table',
  description: 'Wild game butchering guides, cut diagrams, field-to-freezer processing, meat care techniques, and recipes to honor your harvest from skinning to supper.',
}

const features = [
  {
    icon: Scissors,
    title: 'Butchering Guides',
    description: 'Step-by-step tutorials for field dressing, skinning, quartering, and breaking down game — elk, deer, antelope, and more.',
  },
  {
    icon: Beef,
    title: 'Cut Diagrams',
    description: 'Interactive cut maps showing where every steak, roast, and grind comes from — so you get the most out of every animal.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Wild Game Recipes',
    description: 'Recipes built for wild game — elk tenderloin, venison burgers, goose jerky, and everything in between.',
  },
  {
    icon: Thermometer,
    title: 'Meat Care & Storage',
    description: 'Temperature guidelines, aging techniques, vacuum sealing tips, and freezer management to preserve your harvest.',
  },
  {
    icon: ClipboardList,
    title: 'Processing Checklists',
    description: 'Printable checklists for field processing, home butchering, and taking your game to a processor — nothing gets missed.',
  },
  {
    icon: BookOpen,
    title: 'Courses',
    description: 'Video courses on game processing from field to freezer — taught by professional butchers and experienced hunters.',
  },
]

export default function ButcherBlockPage() {
  return (
    <div className="min-h-dvh bg-base text-primary">
      <Navbar />
      <Nav2 />
      <main>

      {/* Hero with background image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hunting/on_the_hunt.JPG"
            alt="In the field"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/70 to-base" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="flex items-center gap-3 mb-2">
            <Beef className="h-7 w-7 text-red-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-primary">The Butcher Block</h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-400 mb-4">From Field to Table</p>
          <p className="text-secondary text-lg max-w-2xl mb-0">
            Game and fish recipes, field-to-freezer processing techniques, and storage guides — honor your harvest from skinning to supper.
          </p>
        </div>

      {/* About the Module */}
      <div className="relative max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-primary mb-3">What is The Butcher Block?</h2>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          The Butcher Block is for hunters and anglers who believe the work doesn&apos;t end when the animal hits the ground. Processing your own game is one of the most rewarding parts of the harvest — and one of the most important. This module teaches you how to do it right, from the first cut to the dinner table.
        </p>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          Learn field dressing and quartering with step-by-step guides for every major game species. Understand where every cut comes from with interactive diagrams. Get recipes specifically designed for wild game — because elk doesn&apos;t cook like beef, and goose doesn&apos;t cook like chicken. Master meat care with aging techniques, temperature management, and freezer storage best practices.
        </p>
        <p className="text-secondary text-sm leading-relaxed">
          Whether you process everything yourself or take it to a butcher, understanding what&apos;s happening to your meat makes you a better hunter and a better cook. The Butcher Block makes sure nothing goes to waste.
        </p>
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

        <ModuleCta moduleHref="/auth/signup" moduleName="Butcher Block" />
      </section>

      </main>
      <footer className="border-t border-subtle py-10 text-center text-muted text-xs">
        <p>&copy; {new Date().getFullYear()} Praevius LLC. All rights reserved.</p>
      </footer>
    </div>
  )
}
