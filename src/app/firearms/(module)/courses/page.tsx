import { GraduationCap } from 'lucide-react'

export default function FirearmsCoursesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <GraduationCap className="h-5 w-5 text-blue-400" />
        <h1 className="text-2xl font-bold text-primary">Course Library</h1>
      </div>
      <p className="text-secondary text-sm mb-6">
        Safety fundamentals, marksmanship, and maintenance — from certified instructors.
      </p>

      <div className="glass-card border border-subtle rounded-lg p-6 text-center text-secondary text-sm">
        Courses coming soon. You&apos;ll be notified when the first course launches.
      </div>
    </div>
  )
}
