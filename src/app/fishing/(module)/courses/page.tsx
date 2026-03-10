import { GraduationCap } from 'lucide-react'

export default function FishingCoursesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <GraduationCap className="h-5 w-5 text-cyan-400" />
        <h1 className="text-2xl font-bold text-primary">Course Library</h1>
      </div>
      <p className="text-secondary text-sm mb-6">
        Casting technique, knot tying, fly patterns, and reading water — for every style of fishing.
      </p>

      <div className="glass-card border border-subtle rounded-lg p-6 text-center text-secondary text-sm">
        Courses coming soon. You&apos;ll be notified when the first course launches.
      </div>
    </div>
  )
}
