/** Generate a URL-safe slug from a title */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Category value → display label mapping */
export const BLOG_CATEGORY_LABELS: Record<string, string> = {
  field_reports: 'Field Reports',
  gear_reviews: 'Gear Reviews',
  strategy_breakdowns: 'Strategy Breakdowns',
  scouting_intel: 'Scouting Intel',
  community_stories: 'Community Stories',
  how_to_guides: 'How-To Guides',
}

/** For TacticalSelect options */
export const BLOG_CATEGORY_OPTIONS = Object.entries(BLOG_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
)

export const BLOG_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]
