'use client'

import { useState } from 'react'
import { CheckCircle, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function MarkCompleteButton({
  courseId,
  initialCompleted,
}: {
  courseId: string
  initialCompleted: boolean
}) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)

  async function toggleComplete() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (completed) {
        // Unmark
        await supabase
          .from('course_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId)
        setCompleted(false)
      } else {
        // Mark complete
        await supabase
          .from('course_progress')
          .upsert({
            user_id: user.id,
            course_id: courseId,
            completed: true,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,course_id' })
        setCompleted(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleComplete}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-medium transition-colors ${
        completed
          ? 'text-accent-hover hover:text-secondary'
          : 'text-secondary hover:text-primary'
      }`}
    >
      {completed ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {completed ? 'Completed' : 'Mark as complete'}
    </button>
  )
}
