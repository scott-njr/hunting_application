import { Target, Shield, Compass } from 'lucide-react'
import { createCoursesPage } from '@/lib/factories/create-courses-page'

export default createCoursesPage({
  moduleSlug: 'hunting',
  accentColor: 'text-accent-hover',
  accentBgDim: 'bg-accent-dim',
  completedBadgeBg: 'bg-accent/90',
  subtitle: 'Strategy, safety, and field skills from experienced hunters.',
  upgradeDescription: 'Upgrade to Pro to access all hunting strategy courses, including draw tag strategy, unit scouting, and shot placement.',
  categoryMeta: {
    'getting-started': { label: 'Getting Started', icon: Compass },
    'draw-strategy': { label: 'Draw Strategy', icon: Target },
    'regulations-safety': { label: 'Regulations & Safety', icon: Shield },
  },
  categoryOrder: ['getting-started', 'draw-strategy', 'regulations-safety'],
  courseImages: {
    'first-hunting-license': 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=480&h=280&fit=crop&crop=center',
    'first-hunt-roadmap': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=480&h=280&fit=crop&crop=center',
    'understanding-western-draws': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480&h=280&fit=crop&crop=center',
    'how-preference-points-work': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=280&fit=crop&crop=center',
    'advanced-unit-selection': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=480&h=280&fit=crop&crop=center',
    'hunter-safety-ethics': 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=480&h=280&fit=crop&crop=center',
    'western-state-regulations': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=480&h=280&fit=crop&crop=center',
    'backcountry-first-aid': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=480&h=280&fit=crop&crop=center',
    'public-land-access': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=280&fit=crop&crop=center',
  },
  categoryFallbackImages: {
    'getting-started': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=480&h=280&fit=crop&crop=center',
    'draw-strategy': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480&h=280&fit=crop&crop=center',
    'regulations-safety': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=480&h=280&fit=crop&crop=center',
  },
  defaultFallbackImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480&h=280&fit=crop&crop=center',
})
