import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, BookOpen, Video, Lock, ChevronRight } from 'lucide-react'
import { getUserModuleTier, hasModuleTierAccess, MODULE_TIER_LABELS } from '@/lib/modules'
import type { ModuleSlug } from '@/lib/modules'
import { CourseMarkdown } from '@/components/courses/course-markdown'
import { MarkCompleteButton } from '@/components/courses/mark-complete-button'

/** Module-specific accent colors for course detail pages */
const MODULE_COURSE_COLORS: Record<string, {
  badge: string
  dotActive: string
  dotHover: string
  nextBtn: string
}> = {
  hunting: {
    badge: 'bg-accent-dim text-accent-hover',
    dotActive: 'bg-accent',
    dotHover: 'hover:bg-accent/40',
    nextBtn: 'text-accent-hover hover:text-accent bg-accent-dim hover:bg-accent-dim/60',
  },
  archery: {
    badge: 'bg-teal-900/30 text-teal-400',
    dotActive: 'bg-teal-500',
    dotHover: 'hover:bg-teal-500/40',
    nextBtn: 'text-teal-400 hover:text-teal-300 bg-teal-900/20 hover:bg-teal-900/30',
  },
  firearms: {
    badge: 'bg-red-900/30 text-red-400',
    dotActive: 'bg-red-500',
    dotHover: 'hover:bg-red-500/40',
    nextBtn: 'text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30',
  },
  medical: {
    badge: 'bg-pink-900/30 text-pink-400',
    dotActive: 'bg-pink-500',
    dotHover: 'hover:bg-pink-500/40',
    nextBtn: 'text-pink-400 hover:text-pink-300 bg-pink-900/20 hover:bg-pink-900/30',
  },
  fishing: {
    badge: 'bg-cyan-900/30 text-cyan-400',
    dotActive: 'bg-cyan-500',
    dotHover: 'hover:bg-cyan-500/40',
    nextBtn: 'text-cyan-400 hover:text-cyan-300 bg-cyan-900/20 hover:bg-cyan-900/30',
  },
  fitness: {
    badge: 'bg-amber-900/30 text-amber-400',
    dotActive: 'bg-amber-500',
    dotHover: 'hover:bg-amber-500/40',
    nextBtn: 'text-amber-400 hover:text-amber-300 bg-amber-900/20 hover:bg-amber-900/30',
  },
}

const DEFAULT_COLORS = MODULE_COURSE_COLORS.hunting

/** Creates a course detail page component for the given module. */
export function createCourseDetailPage(moduleSlug: ModuleSlug) {
  const colors = MODULE_COURSE_COLORS[moduleSlug] ?? DEFAULT_COLORS
  const basePath = `/${moduleSlug}/courses`

  return async function CourseDetailPage({
    params,
  }: {
    params: Promise<{ slug: string }>
  }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const tier = await getUserModuleTier(supabase, user.id, moduleSlug)

    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('module', moduleSlug)
      .eq('published', true)
      .maybeSingle()

    if (!course) notFound()

    const canAccess = hasModuleTierAccess(tier, course.tier_required)

    const { data: progress } = await supabase
      .from('course_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()

    const isCompleted = progress?.completed ?? false

    const { data: siblings } = await supabase
      .from('courses')
      .select('slug, title, sort_order')
      .eq('module', moduleSlug)
      .eq('category', course.category ?? '')
      .eq('published', true)
      .order('sort_order', { ascending: true })

    const siblingList = siblings ?? []
    const currentIdx = siblingList.findIndex(s => s.slug === slug)
    const prevCourse = currentIdx > 0 ? siblingList[currentIdx - 1] : null
    const nextCourse = currentIdx < siblingList.length - 1 ? siblingList[currentIdx + 1] : null
    const lessonNumber = currentIdx + 1
    const totalInCategory = siblingList.length

    const categoryLabel = course.category?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Course'

    return (
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-6">
          <Link href={basePath} className="hover:text-secondary transition-colors">
            Courses
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-secondary">{categoryLabel}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-secondary truncate max-w-[200px]">{course.title}</span>
        </div>

        {/* Lesson header */}
        <div className="bg-surface border border-subtle rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`${colors.badge} text-xs font-bold px-2.5 py-1 rounded-full`}>
              Lesson {lessonNumber} of {totalInCategory}
            </span>
            <span className="text-muted text-xs">{categoryLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-secondary text-sm leading-relaxed mb-4">{course.description}</p>
          )}
          <div className="flex items-center gap-4">
            {course.duration_minutes && (
              <span className="text-muted text-xs flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {course.duration_minutes} min read
              </span>
            )}
            <span className="text-muted text-xs flex items-center gap-1.5">
              {course.content_type === 'article' ? (
                <BookOpen className="h-3.5 w-3.5" />
              ) : (
                <Video className="h-3.5 w-3.5" />
              )}
              {course.content_type === 'article' ? 'Article' : 'Video'}
            </span>
          </div>

          {/* Lesson progress dots */}
          {totalInCategory > 1 && (
            <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-subtle">
              {siblingList.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`${basePath}/${s.slug}`}
                  title={s.title}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIdx
                      ? `w-6 ${colors.dotActive}`
                      : `w-2 bg-elevated ${colors.dotHover}`
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {!canAccess ? (
          <div className="bg-surface border border-subtle rounded-xl p-8 text-center">
            <Lock className="h-6 w-6 text-muted mx-auto mb-3" />
            <p className="text-primary font-medium mb-1">This lesson requires {MODULE_TIER_LABELS[course.tier_required] ?? course.tier_required}</p>
            <p className="text-muted text-sm mb-4">Upgrade your membership to access this content.</p>
            <Link
              href="/pricing"
              className="btn-primary rounded-lg px-6 py-2 text-sm font-semibold inline-block"
            >
              View Plans
            </Link>
          </div>
        ) : (
          <>
            {/* Article body */}
            {course.content_type === 'article' && course.body ? (
              <div className="bg-surface border border-subtle rounded-xl overflow-hidden">
                <div className="px-8 py-8 sm:px-10 sm:py-10">
                  <CourseMarkdown content={course.body} />
                </div>
              </div>
            ) : course.content_type === 'video' ? (
              <div className="bg-surface border border-subtle rounded-xl p-8 text-center">
                <Video className="h-8 w-8 text-muted mx-auto mb-3" />
                <p className="text-secondary text-sm">Video content coming soon.</p>
              </div>
            ) : null}

            {/* Bottom bar: mark complete + prev/next */}
            <div className="mt-6 bg-surface border border-subtle rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <MarkCompleteButton
                  courseId={course.id}
                  initialCompleted={isCompleted}
                />

                <div className="flex items-center gap-2">
                  {prevCourse && (
                    <Link
                      href={`${basePath}/${prevCourse.slug}`}
                      className="flex items-center gap-1.5 text-muted hover:text-secondary text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-elevated"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Previous
                    </Link>
                  )}
                  {nextCourse && (
                    <Link
                      href={`${basePath}/${nextCourse.slug}`}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg ${colors.nextBtn}`}
                    >
                      Next Lesson
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Back to courses */}
            <div className="mt-4 text-center">
              <Link
                href={basePath}
                className="text-muted hover:text-secondary text-xs transition-colors"
              >
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Back to Course Library
              </Link>
            </div>
          </>
        )}
      </div>
    )
  }
}
