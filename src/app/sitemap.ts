import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('id, name, weight, image_url, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  // Group weight variants under their canonical product/origin URL.
  const seen = new Set<string>()
  const productUrls: MetadataRoute.Sitemap = (products ?? [])
    .filter((p) => {
      const origin = p.weight?.includes('|') ? p.weight.split('|')[0] : ''
      const key = `${p.name}|${origin}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: p.image_url ? [p.image_url] : undefined,
    }))

  return [
    { url: SITE_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/products`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/tools`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/honey`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${SITE_URL}/about`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/wholesale`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/terms`,            lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...productUrls,
  ]
}
