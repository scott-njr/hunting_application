import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, BookOpen, Video, Clock, Lock,
  CheckCircle2, Target, Compass, Trophy, Wrench,
} from 'lucide-react'
import { getUserModuleTier, hasModuleTierAccess } from '@/lib/modules'
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

const CATEGORY_META: Record<string, { label: string; icon: typeof Target }> = {
  'getting-started': { label: 'Getting Started', icon: Compass },
  'technique': { label: 'Technique & Form', icon: Target },
  'competition': { label: 'Competition', icon: Trophy },
  'bow-setup': { label: 'Bow Setup & Tuning', icon: Wrench },
}

const CATEGORY_ORDER = ['getting-started', 'technique', 'bow-setup', 'competition']

const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  'getting-started': 'https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=480&h=280&fit=crop&crop=center',
  'technique': 'https://images.unsplash.com/photo-1565711561500-49678a10a63f?w=480&h=280&fit=crop&crop=center',
  'bow-setup': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=480&h=280&fit=crop&crop=center',
  'competition': 'https://images.unsplash.com/photo-1541753236788-b0ac1fc5009d?w=480&h=280&fit=crop&crop=center',
}

function getCourseImage(category: string | null): string {
  return CATEGORY_FALLBACK_IMAGE[category ?? '']
    ?? 'https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=480&h=280&fit=crop&crop=center'
}

export default async function ArcheryCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const tier = await getUserModuleTier(supabase, user.id, 'archery')

  const { data: courses } = await supabase
    .from('courses')
    .select('id, content_type, title, slug, description, duration_minutes, tier_required, category, sort_order')
    .eq('module', 'archery')
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

  const totalCourses = allCourses.filter(c => hasModuleTierAccess(tier, c.tier_required)).length
  const completedCount = allCourses.filter(c => completedSet.has(c.id) && hasModuleTierAccess(tier, c.tier_required)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="h-5 w-5 text-teal-400" />
            <h1 className="text-2xl font-bold text-primary">Course Library</h1>
          </div>
          <p className="text-secondary text-sm">
            Technique, equipment, and competition strategy from experienced archers.
          </p>
        </div>

        {tier !== 'free' && totalCourses > 0 && (
          <div className="hidden sm:flex items-center gap-3 bg-surface border border-subtle rounded-lg px-4 py-2.5">
            <div className="h-8 w-8 rounded-full bg-teal-900/30 flex items-center justify-center">
              <span className="text-teal-400 text-xs font-bold">{Math.round((completedCount / totalCourses) * 100)}%</span>
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
        description="Upgrade to Pro to access all archery courses, including shot mechanics, bow tuning, and competition prep."
      />

      {tier !== 'free' && (
        <div className="space-y-10">
          {sortedCategories.map(category => {
            const meta = CATEGORY_META[category]
            const categoryCourses = grouped.get(category) ?? []
            const CategoryIcon = meta?.icon ?? BookOpen

            return (
              <section key={category}>
                <div className="flex items-center gap-2.5 mb-4">
                  <CategoryIcon className="h-4 w-4 text-teal-400" />
                  <h2 className="text-primary font-semibold text-sm uppercase tracking-wide">
                    {meta?.label ?? category.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex-1 h-px bg-subtle" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryCourses.map(course => {
                    const canAccess = hasModuleTierAccess(tier, course.tier_required)
                    const imageUrl = getCourseImage(course.category)
                    const completed = completedSet.has(course.id)

                    const cardContent = (
                      <>
                        <div className="relative aspect-[16/9] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={course.title}
                            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!canAccess ? 'brightness-50' : ''}`}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          {completed && (
                            <div className="absolute top-2.5 right-2.5 bg-teal-500/90 rounded-full p-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          {!canAccess && (
                            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                              <Lock className="h-3 w-3 text-white/80" />
                              <span className="text-white/80 text-[10px] font-medium">PRO+</span>
                            </div>
                          )}
                          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                            {course.duration_minutes && (
                              <span className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {course.duration_minutes} min
                              </span>
                            )}
                            <span className="bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              {course.content_type === 'article' ? <><BookOpen className="h-2.5 w-2.5" /> Article</> : <><Video className="h-2.5 w-2.5" /> Video</>}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className={`font-semibold text-sm leading-snug mb-1.5 transition-colors line-clamp-2 ${canAccess ? 'text-primary group-hover:text-teal-400' : 'text-secondary'}`}>
                            {course.title}
                          </h3>
                          {course.description && (
                            <p className="text-muted text-xs leading-relaxed line-clamp-2">{course.description}</p>
                          )}
                        </div>
                      </>
                    )

                    if (canAccess) {
                      return (
                        <Link
                          key={course.id}
                          href={`/archery/courses/${course.slug}`}
                          className="group bg-surface border border-subtle rounded-xl overflow-hidden hover:border-default hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
                        >
                          {cardContent}
                        </Link>
                      )
                    }

                    return (
                      <div key={course.id} className="bg-surface border border-subtle rounded-xl overflow-hidden opacity-70 cursor-not-allowed">
                        {cardContent}
                      </div>
                    )
                  })}
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
