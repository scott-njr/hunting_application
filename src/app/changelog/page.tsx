import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/navbar'
import { Nav2 } from '@/components/layout/nav2'
import { PublicFooter } from '@/components/layout/public-footer'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Recent fixes, improvements, and new features added to Lead the Wild by Praevius.',
  alternates: { canonical: '/changelog' },
}

type ReleaseIssue = {
  id: string
  module: string
  category: string
  title: string
  resolution: string | null
  release_tag: string
  resolved_at: string | null
}

type Release = {
  tag: string
  issues: ReleaseIssue[]
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug Fix',
  feature_request: 'New Feature',
  content_error: 'Content Fix',
  other: 'Improvement',
}

const MODULE_LABELS: Record<string, string> = {
  hunting: 'Hunting',
  archery: 'Archery',
  firearms: 'Firearms',
  medical: 'Medical',
  fishing: 'Fishing',
  fitness: 'Fitness',
}

async function getReleases(): Promise<Release[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/issues/releases`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.releases ?? []
  } catch {
    return []
  }
}

export default async function ChangelogPage() {
  const releases = await getReleases()

  return (
    <div className="min-h-dvh bg-base text-primary flex flex-col">
      <Navbar />
      <Nav2 />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-primary mb-2">Changelog</h1>
        <p className="text-sm text-secondary mb-8">
          Recent fixes and improvements to Lead the Wild.
        </p>

        {releases.length === 0 ? (
          <p className="text-sm text-muted">No releases yet. Check back soon!</p>
        ) : (
          <div className="space-y-8">
            {releases.map(release => (
              <div key={release.tag}>
                <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  {release.tag}
                </h2>
                <div className="space-y-2 pl-4 border-l border-subtle">
                  {release.issues.map(issue => (
                    <div key={issue.id} className="bg-surface border border-subtle rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-elevated text-secondary border border-subtle">
                          {CATEGORY_LABELS[issue.category] ?? issue.category}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-elevated text-secondary border border-subtle">
                          {MODULE_LABELS[issue.module] ?? issue.module}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-primary">{issue.title}</h3>
                      {issue.resolution && (
                        <p className="text-sm text-secondary mt-1">{issue.resolution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
