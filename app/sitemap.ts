import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doko-pasal.vercel.app'
  const lastModified = new Date('2026-01-01')

  // Public routes only (robots.ts disallows /admin/, /api/, /auth/).
  // ponytail: add per-product URLs via supabase fetch if SEO needs it.
  return [
    { url: baseUrl, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified, changeFrequency: 'daily', priority: 0.9 },
  ]
}
