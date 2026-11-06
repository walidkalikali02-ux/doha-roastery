import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/require-admin'
import { BlogPostInput, BlogPostUpdate } from '@/lib/blog-input'

function invalidate() {
  revalidatePath('/blog', 'layout')
  revalidatePath('/sitemap.xml')
}
function failure(code?: string) {
  if (code === '23505') return Response.json({ error: 'This URL slug is already in use. Choose a different slug.' }, { status: 409 })
  if (code === '42P01' || code === 'PGRST205') return Response.json({ error: 'Blog storage is not installed. Apply the blog_posts database migration first.' }, { status: 503 })
  return Response.json({ error: 'Could not save the article. Please retry.' }, { status: 503 })
}
export async function GET(request: Request) {
  const db = await requireAdmin(request)
  if (db instanceof Response) return db
  const { data, error } = await db.from('blog_posts').select('*').order('updated_at', { ascending: false })
  if (error) return failure(error.code)
  return Response.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } })
}
export async function POST(request: Request) {
  const db = await requireAdmin(request)
  if (db instanceof Response) return db
  const parsed = BlogPostInput.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Check required Arabic/English fields, image, sources, and URL slug.', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
  const { data, error } = await db.from('blog_posts').insert({ ...parsed.data, published_at: parsed.data.status === 'published' ? new Date().toISOString() : null }).select().single()
  if (error) return failure(error.code)
  invalidate()
  return Response.json({ data }, { status: 201 })
}
export async function PATCH(request: Request) {
  const db = await requireAdmin(request)
  if (db instanceof Response) return db
  const parsed = BlogPostUpdate.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Check the article fields and reload before saving.' }, { status: 400 })
  const { id, expectedUpdatedAt, post } = parsed.data
  const { data: current, error: readError } = await db.from('blog_posts').select('published_at,slug').eq('id', id).maybeSingle()
  if (readError) return failure(readError.code)
  if (!current) return Response.json({ error: 'Article not found.' }, { status: 404 })
  // Published URLs are stable: avoid breaking existing search results and links.
  if (current.published_at && current.slug !== post.slug) return Response.json({ error: 'The URL slug cannot change after first publication.' }, { status: 400 })
  const { data, error } = await db.from('blog_posts').update({ ...post, published_at: current.published_at ?? (post.status === 'published' ? new Date().toISOString() : null) }).eq('id', id).eq('updated_at', expectedUpdatedAt).select().maybeSingle()
  if (error) return failure(error.code)
  if (!data) return Response.json({ error: 'This article changed. Reload and reopen it before saving.' }, { status: 409 })
  invalidate()
  return Response.json({ data })
}
export async function DELETE(request: Request) {
  const db = await requireAdmin(request)
  if (db instanceof Response) return db
  const parsed = z.object({ id: z.string().uuid(), expectedUpdatedAt: z.string().datetime({ offset: true }) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid article.' }, { status: 400 })
  const { data, error } = await db.from('blog_posts').delete().eq('id', parsed.data.id).eq('updated_at', parsed.data.expectedUpdatedAt).select('id').maybeSingle()
  if (error) return failure(error.code)
  if (!data) return Response.json({ error: 'This article changed. Reload before deleting.' }, { status: 409 })
  invalidate()
  return Response.json({ ok: true })
}
