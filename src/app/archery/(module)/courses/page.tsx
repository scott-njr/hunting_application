import { Target, Compass, Trophy, Wrench } from 'lucide-react'
import { createCoursesPage } from '@/lib/factories/create-courses-page'

export default createCoursesPage({
  moduleSlug: 'archery',
  accentColor: 'text-teal-400',
  accentBgDim: 'bg-teal-900/30',
  completedBadgeBg: 'bg-teal-500/90',
  subtitle: 'Technique, equipment, and competition strategy from experienced archers.',
  upgradeDescription: 'Upgrade to Pro to access all archery courses, including shot mechanics, bow tuning, and competition prep.',
  categoryMeta: {
    'getting-started': { label: 'Getting Started', icon: Compass },
    'technique': { label: 'Technique & Form', icon: Target },
    'competition': { label: 'Competition', icon: Trophy },
    'bow-setup': { label: 'Bow Setup & Tuning', icon: Wrench },
  },
  categoryOrder: ['getting-started', 'technique', 'bow-setup', 'competition'],
  categoryFallbackImages: {
    'getting-started': 'https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=480&h=280&fit=crop&crop=center',
    'technique': 'https://images.unsplash.com/photo-1565711561500-49678a10a63f?w=480&h=280&fit=crop&crop=center',
    'bow-setup': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=280&fit=crop&crop=center',
    'competition': 'https://images.unsplash.com/photo-1541753236788-b0ac1fc5009d?w=480&h=280&fit=crop&crop=center',
  },
  defaultFallbackImage: 'https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=480&h=280&fit=crop&crop=center',
})
