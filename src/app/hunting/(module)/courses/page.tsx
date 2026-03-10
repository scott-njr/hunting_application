import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, BookOpen, Video, Clock, Lock,
  CheckCircle2, Target, Shield, Compass,
} from 'lucide-react'
import { getUserModuleTier, hasModuleTierAccess, type ModuleTier } from '@/lib/modules'
import { UpgradeGate } from '@/components/dashboard/upgrade-gate'

type Course = {
  id: string
  content_type: 'article' | 'video'
  title: string
  slug: string
  description: string | null
  duration_minutes: number | null
  tier_required: string
  category: string | null
  sort_order: number
}

/* ── Category metadata ── */
const CATEGORY_META: Record<string, { label: string; icon: typeof Target }> = {
  'getting-started': { label: 'Getting Started', icon: Compass },
  'draw-strategy': { label: 'Draw Strategy', icon: Target },
  'regulations-safety': { label: 'Regulations & Safety', icon: Shield },
}

const CATEGORY_ORDER = ['getting-started', 'draw-strategy', 'regulations-safety']

/* ── Curated course thumbnail images (Unsplash, free to use) ── */
const COURSE_IMAGES: Record<string, string> = {
  // Getting Started
  'first-hunting-license': 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=480&h=280&fit=crop&crop=center',
  'first-hunt-roadmap': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=480&h=280&fit=crop&crop=center',
  // Draw Strategy
  'understanding-western-draws': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480&h=280&fit=crop&crop=center',
  'how-preference-points-work': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=480&h=280&fit=crop&crop=center',
  'advanced-unit-selection': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=480&h=280&fit=crop&crop=center',
  // Regulations & Safety
  'hunter-safety-ethics': 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=480&h=280&fit=crop&crop=center',
  'western-state-regulations': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=480&h=280&fit=crop&crop=center',
  'backcountry-first-aid': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=480&h=280&fit=crop&crop=center',
  'public-land-access': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=280&fit=crop&crop=center',
}

// Fallback by category
const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  'getting-started': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=480&h=280&fit=crop&crop=center',
  'draw-strategy': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480&h=280&fit=crop&crop=center',
  'regulations-safety': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=480&h=280&fit=crop&crop=center',
}

function getCourseImage(slug: string, category: string | null): string {
  return COURSE_IMAGES[slug]
    ?? CATEGORY_FALLBACK_IMAGE[category ?? '']
    ?? 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480&h=280&fit=crop&crop=center'
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const tier = await getUserModuleTier(supabase, user.id, 'hunting')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, content_type, title, slug, description, duration_minutes, tier_required, category, sort_order')
    .eq('module', 'hunting')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  const { data: progress } = await supabase
    .from('course_progress')
    .select('course_id, completed')
    .eq('user_id', user.id)

  const completedSet = new Set(
    (progress ?? []).filter(p => p.completed).map(p => p.course_id)
  )

  const allCourses = courses ?? []

  // Group by category
  const grouped = new Map<string, Course[]>()
  for (const course of allCourses) {
    const cat = course.category ?? 'uncategorized'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(course)
  }

  const sortedCategories = [
    ...CATEGORY_ORDER.filter(c => grouped.has(c)),
    ...[...grouped.keys()].filter(c => !CATEGORY_ORDER.includes(c)),
  ]

  // Progress stats
  const totalCourses = allCourses.filter(c => hasModuleTierAccess(tier, c.tier_required)).length
  const completedCount = allCourses.filter(c => completedSet.has(c.id) && hasModuleTierAccess(tier, c.tier_required)).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="h-5 w-5 text-accent-hover" />
            <h1 className="text-2xl font-bold text-primary">Course Library</h1>
          </div>
          <p className="text-secondary text-sm">
            Strategy, safety, and field skills from experienced hunters.
          </p>
        </div>

        {/* Compact progress */}
        {tier !== 'free' && totalCourses > 0 && (
          <div className="hidden sm:flex items-center gap-3 bg-surface border border-subtle rounded-lg px-4 py-2.5">
            <div className="h-8 w-8 rounded-full bg-accent-dim flex items-center justify-center">
              <span className="text-accent-hover text-xs font-bold">{Math.round((completedCount / totalCourses) * 100)}%</span>
            </div>
            <div>
              <div className="text-primary text-sm font-semibold">{completedCount}/{totalCourses}</div>
              <div className="text-muted text-[10px] uppercase tracking-wider">Complete</div>
            </div>
          </div>
        )}
      </div>

      <UpgradeGate
        requiredTier="basic"
        currentTier={tier}
        feature="Course Library"
        description="Upgrade to Pro to access all hunting strategy courses, including draw tag strategy, unit scouting, and shot placement."
      />

      {tier !== 'free' && (
        <div className="space-y-10">
          {sortedCategories.map(category => {
            const meta = CATEGORY_META[category]
            const categoryCourses = grouped.get(category) ?? []
            const CategoryIcon = meta?.icon ?? BookOpen

            return (
              <section key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <CategoryIcon className="h-4 w-4 text-accent-hover" />
                  <h2 className="text-primary font-semibold text-sm uppercase tracking-wide">
                    {meta?.label ?? category.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex-1 h-px bg-subtle" />
                </div>

                {/* Card grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryCourses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      userTier={tier}
                      completed={completedSet.has(course.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {allCourses.length === 0 && (
            <div className="glass-card border border-subtle rounded-lg p-6 text-center text-secondary text-sm">
              Courses coming soon. You&apos;ll be notified when the first course launches.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CourseCard({
  course,
  userTier,
  completed,
}: {
  course: Course
  userTier: ModuleTier
  completed: boolean
}) {
  const canAccess = hasModuleTierAccess(userTier, course.tier_required)
  const imageUrl = getCourseImage(course.slug, course.category)

  const cardContent = (
    <>
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={course.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !canAccess ? 'brightness-50' : ''
          }`}
          loading="lazy"
        />

        {/* Overlay badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Top-right: status */}
        {completed && (
          <div className="absolute top-2.5 right-2.5 bg-accent/90 rounded-full p-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        {!canAccess && (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
            <Lock className="h-3 w-3 text-white/80" />
            <span className="text-white/80 text-[10px] font-medium">PRO+</span>
          </div>
        )}

        {/* Bottom-left: duration */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          {course.duration_minutes && (
            <span className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {course.duration_minutes} min
            </span>
          )}
          <span className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            {course.content_type === 'article' ? (
              <><BookOpen className="h-2.5 w-2.5" /> Article</>
            ) : (
              <><Video className="h-2.5 w-2.5" /> Video</>
            )}
          </span>
        </div>
      </div>

      {/* Text content */}
      <div className="p-4">
        <h3 className={`font-semibold text-sm leading-snug mb-1.5 transition-colors line-clamp-2 ${
          canAccess
            ? 'text-primary group-hover:text-accent-hover'
            : 'text-secondary'
        }`}>
          {course.title}
        </h3>
        {course.description && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2">
            {course.description}
          </p>
        )}
      </div>
    </>
  )

  if (canAccess) {
    return (
      <Link
        href={`/hunting/courses/${course.slug}`}
        className="group bg-surface border border-subtle rounded-xl overflow-hidden hover:border-default hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div className="bg-surface border border-subtle rounded-xl overflow-hidden opacity-70 cursor-not-allowed">
      {cardContent}
    </div>
  )
}
