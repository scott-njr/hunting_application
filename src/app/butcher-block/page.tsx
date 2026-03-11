import type { Metadata } from 'next'
import {
  Beef, BookOpen, Scissors, Thermometer, UtensilsCrossed,
  ClipboardList,
} from 'lucide-react'
import { createNav2Page } from '@/lib/factories/create-nav2-page'

export const metadata: Metadata = {
  title: 'The Butcher Block — Field to Table',
  description: 'Wild game butchering guides, cut diagrams, field-to-freezer processing, meat care techniques, and recipes to honor your harvest from skinning to supper.',
  alternates: { canonical: '/butcher-block' },
}

export default createNav2Page({
  hero: {
    icon: Beef,
    colorClass: 'text-red-400',
    title: 'The Butcher Block',
    tagline: 'From Field to Table',
    description: 'Game and fish recipes, field-to-freezer processing techniques, and storage guides — honor your harvest from skinning to supper.',
    image: '/images/hunting/on_the_hunt.JPG',
    imageAlt: 'In the field',
  },
  about: {
    heading: 'What is The Butcher Block?',
    paragraphs: [
      'The Butcher Block is for hunters and anglers who believe the work doesn\u2019t end when the animal hits the ground. Processing your own game is one of the most rewarding parts of the harvest — and one of the most important. This module teaches you how to do it right, from the first cut to the dinner table.',
      'Learn field dressing and quartering with step-by-step guides for every major game species. Understand where every cut comes from with interactive diagrams. Get recipes specifically designed for wild game — because elk doesn\u2019t cook like beef, and goose doesn\u2019t cook like chicken. Master meat care with aging techniques, temperature management, and freezer storage best practices.',
      'Whether you process everything yourself or take it to a butcher, understanding what\u2019s happening to your meat makes you a better hunter and a better cook. The Butcher Block makes sure nothing goes to waste.',
    ],
  },
  features: [
    { icon: Scissors, title: 'Butchering Guides', description: 'Step-by-step tutorials for field dressing, skinning, quartering, and breaking down game — elk, deer, antelope, and more.' },
    { icon: Beef, title: 'Cut Diagrams', description: 'Interactive cut maps showing where every steak, roast, and grind comes from — so you get the most out of every animal.' },
    { icon: UtensilsCrossed, title: 'Wild Game Recipes', description: 'Recipes built for wild game — elk tenderloin, venison burgers, goose jerky, and everything in between.' },
    { icon: Thermometer, title: 'Meat Care & Storage', description: 'Temperature guidelines, aging techniques, vacuum sealing tips, and freezer management to preserve your harvest.' },
    { icon: ClipboardList, title: 'Processing Checklists', description: 'Printable checklists for field processing, home butchering, and taking your game to a processor — nothing gets missed.' },
    { icon: BookOpen, title: 'Courses', description: 'Video courses on game processing from field to freezer — taught by professional butchers and experienced hunters.' },
  ],
  cta: { href: '/butcher-block', name: 'Butcher Block' },
})
