import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('id, name, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  // Deduplicate by name — grouped variants share one canonical URL (first representative)
  const seen = new Set<string>()
  const productUrls: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => {
      if (seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [
    { url: SITE_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/products`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/wholesale`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...productUrls,
  ]
}
