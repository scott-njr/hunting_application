import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://praevius.com'
  const lastModified = '2026-03-09'

  return [
    { url: base, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/hunting`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/archery`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/firearms`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fishing`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/fitness`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/medical`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/spearfishing`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/butcher-block`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/mindset`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/newsletter`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/changelog`, lastModified, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/auth/login`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/auth/signup`, changeFrequency: 'yearly', priority: 0.6 },
  ]
}
