import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/onboarding', '/account/', '/home', '/admin/', '/auth/reset-password', '/auth/forgot-password', '/auth/callback'],
      },
    ],
    sitemap: 'https://praevius.com/sitemap.xml',
  }
}
