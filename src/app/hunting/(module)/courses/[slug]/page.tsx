import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, BookOpen, Video, Lock, ChevronRight } from 'lucide-react'
import { getUserModuleTier, hasModuleTierAccess, MODULE_TIER_LABELS } from '@/lib/modules'
import { CourseMarkdown } from './course-markdown'
import { MarkCompleteButton } from './mark-complete-button'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const tier = await getUserModuleTier(supabase, user.id, 'hunting')

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!course) notFound()

  const canAccess = hasModuleTierAccess(tier, course.tier_required)

  // Check completion status
  const { data: progress } = await supabase
    .from('course_progress')
    .select('completed')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  const isCompleted = progress?.completed ?? false

  // Get sibling courses in same category for prev/next navigation
  const { data: siblings } = await supabase
    .from('courses')
    .select('slug, title, sort_order')
    .eq('module', course.module)
    .eq('category', course.category ?? '')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  const siblingList = siblings ?? []
  const currentIdx = siblingList.findIndex(s => s.slug === slug)
  const prevCourse = currentIdx > 0 ? siblingList[currentIdx - 1] : null
  const nextCourse = currentIdx < siblingList.length - 1 ? siblingList[currentIdx + 1] : null
  const lessonNumber = currentIdx + 1
  const totalInCategory = siblingList.length

  // Category display name
  const categoryLabel = course.category?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? 'Course'

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted mb-6">
        <Link href="/hunting/courses" className="hover:text-secondary transition-colors">
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
          <span className="bg-accent-dim text-accent-hover text-xs font-bold px-2.5 py-1 rounded-full">
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
                href={`/hunting/courses/${s.slug}`}
                title={s.title}
                className={`h-2 rounded-full transition-all ${
                  i === currentIdx
                    ? 'w-6 bg-accent'
                    : 'w-2 bg-elevated hover:bg-accent/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {!canAccess ? (
        <div className="bg-surface border border-subtle rounded-xl p-8 text-center">
          <Lock className="h-6 w-6 text-muted mx-auto mb-3" />
          <p className="text-primary font-medium mb-1">This lesson requires {MODULE_TIER_LABELS[(course.tier_required === 'elite' ? 'pro' : course.tier_required) as 'free' | 'basic' | 'pro'] ?? course.tier_required}</p>
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
                    href={`/hunting/courses/${prevCourse.slug}`}
                    className="flex items-center gap-1.5 text-muted hover:text-secondary text-xs transition-colors px-3 py-1.5 rounded-lg hover:bg-elevated"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </Link>
                )}
                {nextCourse && (
                  <Link
                    href={`/hunting/courses/${nextCourse.slug}`}
                    className="flex items-center gap-1.5 text-accent-hover hover:text-accent text-xs font-medium transition-colors px-3 py-1.5 rounded-lg bg-accent-dim hover:bg-accent-dim/60"
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
              href="/hunting/courses"
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
