import { z } from 'zod'
import { BLOG_CATEGORIES } from './blog-types'

export const BlogImage = z.string().trim().max(2000).refine((value) => {
  if (/^\/(?!\/)[^\s\\?#]+\.(?:svg|png|jpe?g|webp|avif)$/i.test(value)) return true
  try { return new URL(value).protocol === 'https:' } catch { return false }
}, 'Use a local image path or an HTTPS image URL')

export const BlogPostInput = z.object({
  slug: z.string().trim().min(3).max(140).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title_ar: z.string().trim().min(3).max(180),
  title_en: z.string().trim().min(3).max(180),
  excerpt_ar: z.string().trim().min(10).max(500),
  excerpt_en: z.string().trim().min(10).max(500),
  content_ar: z.string().trim().min(50).max(80000),
  content_en: z.string().trim().min(50).max(80000),
  category: z.enum(BLOG_CATEGORIES),
  image_url: BlogImage,
  image_alt_ar: z.string().trim().min(3).max(250),
  image_alt_en: z.string().trim().min(3).max(250),
  seo_title_ar: z.string().trim().max(180),
  seo_title_en: z.string().trim().max(180),
  seo_description_ar: z.string().trim().max(320),
  seo_description_en: z.string().trim().max(320),
  sources: z.array(z.object({ label: z.string().trim().min(1).max(200), url: z.string().url().max(2000).refine((v) => v.startsWith('https://')) })).max(20),
  status: z.enum(['draft', 'published']),
}).strict()

export const BlogPostUpdate = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  post: BlogPostInput,
}).strict()
