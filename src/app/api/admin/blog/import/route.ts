import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/require-admin'
import { BLOG_STARTER_ARTICLES } from '@/lib/blog-seed'

// Explicit one-time import. Existing editorial changes and drafts are preserved.
export async function POST(request: Request) {
  const db = await requireAdmin(request)
  if (db instanceof Response) return db
  const now = new Date().toISOString()
  const { data, error } = await db.from('blog_posts').upsert(
    BLOG_STARTER_ARTICLES.map((post) => ({ ...post, published_at: now })),
    { onConflict: 'slug', ignoreDuplicates: true },
  ).select('id')
  if (error) return Response.json({ error: 'Could not import articles. Check that the blog_posts migration has been applied.' }, { status: 503 })
  revalidatePath('/blog', 'layout')
  revalidatePath('/sitemap.xml')
  return Response.json({ imported: data?.length ?? 0 })
}
