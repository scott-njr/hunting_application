import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/', '/pricing', '/about', '/blog', '/newsletter', '/contact', '/spearfishing', '/butcher-block', '/mindset', '/dashboard', '/changelog', '/auth/login', '/auth/signup', '/auth/callback', '/auth/forgot-password', '/auth/reset-password', '/api/webhooks']

// Module root pages are publicly viewable (landing pages), but sub-routes require auth
const PUBLIC_MODULE_ROOTS = ['/hunting', '/archery', '/firearms', '/fishing', '/fitness', '/medical']

// All module sub-routes require at least 'basic' tier (free tier only gets public content)
// Module root pages (Nav2 landing pages) are public — handled by PUBLIC_MODULE_ROOTS above
const MODULE_PREFIXES = ['/hunting/', '/archery/', '/firearms/', '/fishing/', '/fitness/', '/medical/']

// Routes that skip the onboarding check (user is authenticated but hasn't completed onboarding)
const ONBOARDING_EXEMPT = ['/onboarding', '/auth/login', '/auth/signup', '/auth/callback', '/api/subscriptions/select-tier', '/api/users/check-username']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Webhook endpoints bypass all gates (authenticated via shared secret, not cookies)
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // Preview password gate — only active when PREVIEW_PASSWORD is set (Vercel deploys only)
  const previewPassword = process.env.PREVIEW_PASSWORD
  if (previewPassword) {
    const hasPasswordCookie = request.cookies.get('preview_access')?.value === previewPassword
    const queryPassword = request.nextUrl.searchParams.get('password')

    if (!hasPasswordCookie) {
      if (queryPassword === previewPassword) {
        // Correct password in URL — set cookie and redirect to clean URL
        const cleanUrl = new URL(pathname, request.url)
        request.nextUrl.searchParams.forEach((val, key) => {
          if (key !== 'password') cleanUrl.searchParams.set(key, val)
        })
        const response = NextResponse.redirect(cleanUrl)
        response.cookies.set('preview_access', previewPassword, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
        return response
      }

      // No valid password — show a simple gate page
      return new NextResponse(
        `<!DOCTYPE html>
        <html><head><title>Preview Access</title>
        <style>body{background:#121210;color:#f0ece4;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
        .card{background:#1a1a17;border:1px solid #2a2a25;border-radius:12px;padding:2rem;max-width:320px;width:100%}
        h1{font-size:1.1rem;margin:0 0 1rem}input{width:100%;padding:.6rem;background:#121210;border:1px solid #2a2a25;border-radius:6px;color:#f0ece4;font-size:.9rem;box-sizing:border-box}
        button{width:100%;margin-top:.75rem;padding:.6rem;background:#7c9a6e;border:none;border-radius:6px;color:#f0ece4;font-weight:600;font-size:.9rem;cursor:pointer}
        button:hover{background:#6b8a5e}</style></head>
        <body><div class="card"><h1>Preview Access</h1><form method="GET">
        <input name="password" type="password" placeholder="Enter password" autofocus />
        <button type="submit">Enter</button></form></div></body></html>`,
        { status: 401, headers: { 'Content-Type': 'text/html' } }
      )
    }
  }

  // Refresh session and get user
  const { supabaseResponse, user } = await updateSession(request)

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  if (isPublic) return supabaseResponse

  // Module root pages are always public (landing pages with auth-aware CTAs)
  const isModuleRoot = PUBLIC_MODULE_ROOTS.some((route) => pathname === route)
  if (isModuleRoot) return supabaseResponse

  // All other routes require authentication
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if user needs onboarding (skip for exempt routes)
  const isOnboardingExempt = ONBOARDING_EXEMPT.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (!isOnboardingExempt) {
    const supabaseOnboarding = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: memberOnboarding } = await supabaseOnboarding
      .from('members')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (memberOnboarding && !memberOnboarding.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Admin routes require is_admin = true
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: adminCheck } = await supabaseAdmin
      .from('members')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!adminCheck?.is_admin) {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    return supabaseResponse
  }

  // Module sub-routes require an active paid subscription for that specific module
  const isModuleSubRoute = MODULE_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isModuleSubRoute) {
    const moduleSlug = pathname.split('/')[1] // e.g., /hunting/deadlines → 'hunting'

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: subscription } = await supabase
      .from('module_subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .eq('module_slug', moduleSlug)
      .maybeSingle()

    const moduleTier = (subscription?.status === 'active' ? subscription.tier : 'free') as string
    if (moduleTier === 'free') {
      const pricingUrl = new URL('/pricing', request.url)
      pricingUrl.searchParams.set('upgrade', 'basic')
      pricingUrl.searchParams.set('module', moduleSlug)
      pricingUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(pricingUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
