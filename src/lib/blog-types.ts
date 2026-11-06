export const BLOG_CATEGORIES = ['guides', 'species', 'varieties', 'origins'] as const
export type BlogCategory = typeof BLOG_CATEGORIES[number]
export type BlogLang = 'ar' | 'en'
export const BLOG_LABELS: Record<BlogCategory, { ar: string; en: string }> = {
  guides: { ar: 'دليل القهوة', en: 'Coffee guides' },
  species: { ar: 'الأنواع النباتية', en: 'Coffee species' },
  varieties: { ar: 'الأصناف', en: 'Varieties' },
  origins: { ar: 'بلدان المنشأ', en: 'Origins' },
}

export interface BlogPost {
  id: string
  slug: string
  title_ar: string
  title_en: string
  excerpt_ar: string
  excerpt_en: string
  content_ar: string
  content_en: string
  category: BlogCategory
  image_url: string
  image_alt_ar: string
  image_alt_en: string
  seo_title_ar: string
  seo_title_en: string
  seo_description_ar: string
  seo_description_en: string
  sources: Array<{ label: string; url: string }>
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

export type BlogInput = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'published_at'>
export function blogHref(slug: string | null, lang: BlogLang) {
  return `/blog${slug ? `/${slug}` : ''}${lang === 'en' ? '?lang=en' : ''}`
}
export function readingMinutes(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 180))
}
