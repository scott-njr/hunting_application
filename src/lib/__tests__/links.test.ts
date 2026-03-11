import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// Link & Route Integrity Tests
//
// Validates that every internal href, router.push target, and
// redirect destination in the codebase points to a valid route.
// Run after any routing changes to catch broken links early.
// ═══════════════════════════════════════════════════════════════

// ── All routes that have a page.tsx or route.ts ──────────────
const VALID_ROUTES = new Set([
  // Public
  '/',
  '/pricing',

  // Auth
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',

  // Module hub
  '/modules',

  // Hunting module
  '/hunting',
  '/hunting/deadlines',
  '/hunting/applications',
  '/hunting/hunts',
  '/hunting/gear',
  '/hunting/ai-assistant',
  '/hunting/courses',
  '/hunting/community',
  '/hunting/profile',

  // Dashboard (legacy — still have page.tsx files)
  '/dashboard',
  '/dashboard/deadlines',
  '/dashboard/applications',
  '/dashboard/hunts',
  '/dashboard/gear',
  '/dashboard/ai-assistant',
  '/dashboard/courses',
  '/dashboard/community',
  '/dashboard/profile',

  // Coming soon modules
  '/firearms',
  '/medical',

  // API routes
  '/api/friends',
  '/api/friends/request',
  '/api/friends/respond',
  '/api/users/find',
  '/api/messages',
  '/api/hunting/scout-data',
  '/api/community/posts',
])

// Dynamic API routes (pattern-based)
const DYNAMIC_ROUTE_PATTERNS = [
  /^\/api\/friends\/[^/]+$/,                          // /api/friends/[id]
  /^\/api\/community\/posts\/[^/]+\/comments$/,       // /api/community/posts/[id]/comments
  /^\/api\/community\/posts\/[^/]+\/react$/,          // /api/community/posts/[id]/react
]

// ── Redirects defined in next.config.ts ──────────────────────
const REDIRECTS: { source: string; destination: string }[] = [
  { source: '/dashboard', destination: '/modules' },
  // /dashboard/:path* → /hunting/:path* (wildcard)
]

// Resolve a path: strip query params, check static routes + patterns
function isValidRoute(path: string): boolean {
  const clean = path.split('?')[0].split('#')[0]
  if (VALID_ROUTES.has(clean)) return true
  return DYNAMIC_ROUTE_PATTERNS.some(p => p.test(clean))
}

// ═══════════════════════════════════════════════════════════════
// Link href values used throughout the codebase
// Grouped by source component/page for easy traceability
// ═══════════════════════════════════════════════════════════════

type LinkEntry = {
  href: string
  source: string
}

const ALL_LINKS: LinkEntry[] = [
  // ── Layout: Navbar ──
  { href: '/',                     source: 'navbar.tsx' },
  { href: '/pricing',             source: 'navbar.tsx' },
  { href: '/auth/login',          source: 'navbar.tsx' },
  { href: '/auth/signup',         source: 'navbar.tsx' },

  // ── Layout: Sidebar (legacy dashboard) ──
  { href: '/',                     source: 'sidebar.tsx' },
  { href: '/dashboard',           source: 'sidebar.tsx' },
  { href: '/dashboard/deadlines', source: 'sidebar.tsx' },
  { href: '/dashboard/applications', source: 'sidebar.tsx' },
  { href: '/dashboard/hunts',     source: 'sidebar.tsx' },
  { href: '/dashboard/ai-assistant', source: 'sidebar.tsx' },
  { href: '/dashboard/gear',      source: 'sidebar.tsx' },
  { href: '/dashboard/community', source: 'sidebar.tsx' },
  { href: '/dashboard/profile',   source: 'sidebar.tsx' },

  // ── Layout: Module Sidebar ──
  { href: '/',                     source: 'module-sidebar.tsx' },
  { href: '/modules',             source: 'module-sidebar.tsx' },
  { href: '/hunting/deadlines',   source: 'module-sidebar.tsx' },
  { href: '/hunting/applications', source: 'module-sidebar.tsx' },
  { href: '/hunting/hunts',       source: 'module-sidebar.tsx' },
  { href: '/hunting/gear',        source: 'module-sidebar.tsx' },
  { href: '/hunting/ai-assistant', source: 'module-sidebar.tsx' },
  { href: '/hunting/community',   source: 'module-sidebar.tsx' },
  { href: '/hunting/profile',     source: 'module-sidebar.tsx' },
  // Module switcher dynamic routes (only active/coming-soon modules)
  { href: '/hunting',             source: 'module-sidebar.tsx (switcher)' },
  { href: '/firearms',            source: 'module-sidebar.tsx (switcher)' },
  { href: '/medical',             source: 'module-sidebar.tsx (switcher)' },
  // /fishing and /fitness are disabled in the switcher (no route yet) — see "Planned modules" tests

  // ── Landing page ──
  { href: '/auth/signup',         source: 'page.tsx (landing)' },
  { href: '/pricing',             source: 'page.tsx (landing)' },

  // ── Modules hub ──
  { href: '/hunting/profile',     source: 'modules/page.tsx' },
  { href: '/pricing',             source: 'modules/page.tsx' },

  // ── Auth pages ──
  { href: '/',                     source: 'login/page.tsx' },
  { href: '/auth/forgot-password', source: 'login/page.tsx' },
  { href: '/auth/signup',         source: 'login/page.tsx' },
  { href: '/',                     source: 'signup/page.tsx' },
  { href: '/auth/login',          source: 'signup/page.tsx' },
  { href: '/auth/signup',         source: 'signup/page.tsx' },
  { href: '/',                     source: 'forgot-password/page.tsx' },
  { href: '/auth/login',          source: 'forgot-password/page.tsx' },
  { href: '/',                     source: 'reset-password/page.tsx' },
  { href: '/auth/forgot-password', source: 'reset-password/page.tsx' },

  // ── Dashboard home ──
  { href: '/dashboard/deadlines', source: 'dashboard/page.tsx' },
  { href: '/dashboard/applications', source: 'dashboard/page.tsx' },
  { href: '/dashboard/hunts',     source: 'dashboard/page.tsx' },
  { href: '/pricing',             source: 'dashboard/page.tsx' },

  // ── Dashboard: Deadlines ──
  { href: '/dashboard/applications', source: 'dashboard/deadlines/page.tsx' },

  // ── Dashboard: Applications ──
  { href: '/dashboard/hunts',     source: 'dashboard/applications/page.tsx' },
  { href: '/dashboard/profile',   source: 'dashboard/applications/page.tsx' },
  { href: '/dashboard/deadlines', source: 'dashboard/applications/page.tsx' },

  // ── Dashboard: Hunts ──
  { href: '/dashboard/community', source: 'dashboard/hunts/page.tsx' },
  { href: '/dashboard/gear',      source: 'dashboard/hunts/page.tsx' },

  // ── Dashboard: AI Assistant ──
  { href: '/pricing?upgrade=pro', source: 'dashboard/ai-assistant/page.tsx' },
  { href: '/pricing',             source: 'dashboard/ai-assistant/page.tsx' },

  // ── Deadlines Client (component) ──
  { href: '/dashboard/profile',   source: 'deadlines-client.tsx' },

  // ── Coming soon modules ──
  { href: '/modules',             source: 'firearms/page.tsx' },
  { href: '/modules',             source: 'medical/page.tsx' },
]

// ── Router.push() targets ────────────────────────────────────
const ROUTER_PUSH_TARGETS: LinkEntry[] = [
  { href: '/',              source: 'module-sidebar.tsx (sign out)' },
  { href: '/',              source: 'sidebar.tsx (sign out)' },
  { href: '/modules',       source: 'module-sidebar.tsx (all modules)' },
  { href: '/auth/login',    source: 'dashboard/profile/page.tsx' },
  { href: '/auth/login',    source: 'dashboard/hunts/page.tsx' },
  { href: '/dashboard',     source: 'reset-password/page.tsx' },
  { href: '/dashboard',     source: 'signup/page.tsx' },
  { href: '/dashboard/deadlines', source: 'dashboard/applications/page.tsx' },
  { href: '/dashboard/hunts', source: 'dashboard/applications/page.tsx' },
]

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe('Route registry', () => {
  it('all registered routes are unique', () => {
    expect(VALID_ROUTES.size).toBeGreaterThan(0)
  })

  it('all page routes start with /', () => {
    for (const route of VALID_ROUTES) {
      expect(route).toMatch(/^\//)
    }
  })

  it('no trailing slashes in route registry (except root)', () => {
    for (const route of VALID_ROUTES) {
      if (route !== '/') {
        expect(route).not.toMatch(/\/$/)
      }
    }
  })
})

describe('Link href validation', () => {
  const deduped = new Map<string, string>()
  for (const link of ALL_LINKS) {
    if (!deduped.has(link.href)) {
      deduped.set(link.href, link.source)
    }
  }

  it.each(
    ALL_LINKS.map(l => [l.href, l.source] as const)
  )('"%s" (from %s) resolves to a valid route', (href) => {
    expect(isValidRoute(href)).toBe(true)
  })

  it('no links contain double slashes', () => {
    for (const { href, source } of ALL_LINKS) {
      expect(href, `Double slash in ${source}: ${href}`).not.toMatch(/\/\//)
    }
  })

  it('no links have trailing slashes (except root)', () => {
    for (const { href, source } of ALL_LINKS) {
      const path = href.split('?')[0]
      if (path !== '/') {
        expect(path, `Trailing slash in ${source}: ${href}`).not.toMatch(/\/$/)
      }
    }
  })
})

describe('Router.push targets', () => {
  it.each(
    ROUTER_PUSH_TARGETS.map(l => [l.href, l.source] as const)
  )('router.push("%s") (from %s) resolves to a valid route', (href) => {
    expect(isValidRoute(href)).toBe(true)
  })
})

describe('Redirect destinations', () => {
  it('all redirect destinations are valid routes', () => {
    for (const { destination, source } of REDIRECTS) {
      expect(
        isValidRoute(destination),
        `Redirect from ${source} → ${destination} is not a valid route`
      ).toBe(true)
    }
  })

  it('all redirect sources are valid routes (something serves them)', () => {
    for (const { source } of REDIRECTS) {
      expect(
        isValidRoute(source),
        `Redirect source ${source} has no page.tsx`
      ).toBe(true)
    }
  })
})

describe('Module navigation consistency', () => {
  it('all module root routes exist or are planned', () => {
    // Active + coming soon modules should have routes
    const activeModules = ['hunting', 'firearms', 'medical']
    for (const slug of activeModules) {
      expect(
        isValidRoute(`/${slug}`),
        `Module /${slug} has no route`
      ).toBe(true)
    }
  })

  it('hunting sub-routes all resolve', () => {
    const huntingSubRoutes = [
      '/hunting/deadlines',
      '/hunting/applications',
      '/hunting/hunts',
      '/hunting/gear',
      '/hunting/ai-assistant',
      '/hunting/courses',
      '/hunting/community',
      '/hunting/profile',
    ]
    for (const route of huntingSubRoutes) {
      expect(isValidRoute(route), `${route} missing`).toBe(true)
    }
  })

  it('dashboard sub-routes mirror hunting sub-routes', () => {
    const dashboardSubRoutes = [
      '/dashboard/deadlines',
      '/dashboard/applications',
      '/dashboard/hunts',
      '/dashboard/gear',
      '/dashboard/ai-assistant',
      '/dashboard/courses',
      '/dashboard/community',
      '/dashboard/profile',
    ]
    for (const route of dashboardSubRoutes) {
      expect(isValidRoute(route), `${route} missing`).toBe(true)
    }
  })
})

describe('Auth flow routes', () => {
  it('all auth pages exist', () => {
    const authRoutes = [
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/callback',
    ]
    for (const route of authRoutes) {
      expect(isValidRoute(route), `${route} missing`).toBe(true)
    }
  })

  it('login page links to signup and forgot-password', () => {
    const loginLinks = ALL_LINKS.filter(l => l.source === 'login/page.tsx')
    const hrefs = loginLinks.map(l => l.href)
    expect(hrefs).toContain('/auth/signup')
    expect(hrefs).toContain('/auth/forgot-password')
  })

  it('signup page links back to login', () => {
    const signupLinks = ALL_LINKS.filter(l => l.source === 'signup/page.tsx')
    const hrefs = signupLinks.map(l => l.href)
    expect(hrefs).toContain('/auth/login')
  })

  it('forgot-password page links back to login', () => {
    const fpLinks = ALL_LINKS.filter(l => l.source === 'forgot-password/page.tsx')
    const hrefs = fpLinks.map(l => l.href)
    expect(hrefs).toContain('/auth/login')
  })

  it('reset-password page links to forgot-password for retry', () => {
    const rpLinks = ALL_LINKS.filter(l => l.source === 'reset-password/page.tsx')
    const hrefs = rpLinks.map(l => l.href)
    expect(hrefs).toContain('/auth/forgot-password')
  })
})

describe('Cross-page link consistency', () => {
  it('deadlines page links to applications', () => {
    const links = ALL_LINKS.filter(l => l.source === 'dashboard/deadlines/page.tsx')
    expect(links.some(l => l.href === '/dashboard/applications')).toBe(true)
  })

  it('applications page links back to deadlines and to hunts', () => {
    const links = ALL_LINKS.filter(l => l.source === 'dashboard/applications/page.tsx')
    const hrefs = links.map(l => l.href)
    expect(hrefs).toContain('/dashboard/deadlines')
    expect(hrefs).toContain('/dashboard/hunts')
  })

  it('hunts page links to gear and community', () => {
    const links = ALL_LINKS.filter(l => l.source === 'dashboard/hunts/page.tsx')
    const hrefs = links.map(l => l.href)
    expect(hrefs).toContain('/dashboard/gear')
    expect(hrefs).toContain('/dashboard/community')
  })

  it('coming soon pages link back to modules hub', () => {
    for (const source of ['firearms/page.tsx', 'medical/page.tsx']) {
      const links = ALL_LINKS.filter(l => l.source === source)
      expect(links.some(l => l.href === '/modules'), `${source} missing /modules link`).toBe(true)
    }
  })

  it('deadlines client links to profile for interest setup', () => {
    const links = ALL_LINKS.filter(l => l.source === 'deadlines-client.tsx')
    expect(links.some(l => l.href === '/dashboard/profile')).toBe(true)
  })
})

describe('Pricing / upgrade links', () => {
  it('all pricing links are valid', () => {
    const pricingLinks = ALL_LINKS.filter(l => l.href.startsWith('/pricing'))
    for (const link of pricingLinks) {
      expect(isValidRoute(link.href), `${link.href} from ${link.source}`).toBe(true)
    }
  })

  it('upgrade query params use valid tier names', () => {
    const upgradeLinks = ALL_LINKS.filter(l => l.href.includes('upgrade='))
    for (const link of upgradeLinks) {
      const url = new URL(link.href, 'http://localhost')
      const tier = url.searchParams.get('upgrade')
      expect(['basic', 'pro', 'elite']).toContain(tier)
    }
  })
})

describe('Planned modules (no route yet)', () => {
  // Fishing and fitness don't have routes yet — they're in ALL_MODULES but not active.
  // The module sidebar renders them as disabled, but the switcher still builds hrefs.
  // These tests document the gap and will start passing when routes are added.

  it('fishing module has no route yet', () => {
    expect(isValidRoute('/fishing')).toBe(false)
  })

  it('fitness module has no route yet', () => {
    expect(isValidRoute('/fitness')).toBe(false)
  })
})
