import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getBaseUrl } from '../lib/site'

const INFO_PAGES = [
  '/about',
  '/contact',
  '/faq',
  '/return-policy',
  '/track-order',
  '/terms',
  '/privacy',
  '/shipping',
]

const CATEGORIES = ["Men's Wear", "Women's Wear", "Kids' Wear"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const now = new Date()

  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...CATEGORIES.map((c) => ({
      url: `${baseUrl}/products?category=${encodeURIComponent(c)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...INFO_PAGES.map((p) => ({
      url: `${baseUrl}${p}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return urls
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('products')
      .select('id, updated_at')
      .limit(5000)
    if (error || !data) return urls
    for (const p of data) {
      urls.push({
        url: `${baseUrl}/products/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch {
    // ponytail: static routes only when Supabase unreachable at build.
  }
  return urls
}
