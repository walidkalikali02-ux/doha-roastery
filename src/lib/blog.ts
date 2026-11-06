import 'server-only'
import { cache } from 'react'
import { supabasePublic } from './supabase-public'
import { BLOG_STARTER_ARTICLES } from './blog-seed'
import type { BlogPost } from './blog-types'

const starterDate = '2026-11-05T00:00:00.000Z'
// Until the additive migration is installed, the editorial library can still be
// read. An installed but empty table stays empty: deleted/draft posts never return.
function starterPosts(): BlogPost[] {
  return BLOG_STARTER_ARTICLES.map((post) => ({ ...post, id: post.slug, published_at: starterDate, created_at: starterDate, updated_at: starterDate }))
}
function missingStorage(code?: string) { return code === '42P01' || code === 'PGRST205' }

export const getPublishedPosts = cache(async (): Promise<BlogPost[]> => {
  const { data, error } = await supabasePublic.from('blog_posts').select('*').eq('status', 'published').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).order('slug')
  if (error) {
    if (missingStorage(error.code)) return starterPosts()
    throw new Error('Could not load coffee journal')
  }
  return data as BlogPost[]
})

export const getPublishedPost = cache(async (slug: string): Promise<BlogPost | null> => {
  const { data, error } = await supabasePublic.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').lte('published_at', new Date().toISOString()).maybeSingle()
  if (error) {
    if (missingStorage(error.code)) return starterPosts().find((post) => post.slug === slug) ?? null
    throw new Error('Could not load article')
  }
  return data as BlogPost | null
})
