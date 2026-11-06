import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { BLOG_STARTER_ARTICLES } from '../src/lib/blog-seed'
import { BlogPostInput } from '../src/lib/blog-input'
import { blogHref } from '../src/lib/blog-types'
import { blogMetadata, blogPostingJsonLd } from '../src/lib/blog-seo'
import BlogBody from '../src/components/BlogBody'
import { GET, POST, PATCH, DELETE } from '../src/app/api/admin/blog/route'
import { POST as importArticles } from '../src/app/api/admin/blog/import/route'

test('starter library is bilingual, validated, uniquely addressable, and has local images and sources', () => {
  assert.ok(BLOG_STARTER_ARTICLES.length >= 18)
  assert.equal(new Set(BLOG_STARTER_ARTICLES.map((post) => post.slug)).size, BLOG_STARTER_ARTICLES.length)
  for (const post of BLOG_STARTER_ARTICLES) {
    assert.equal(BlogPostInput.safeParse(post).success, true, post.slug)
    assert.ok(post.content_en.split(/\s+/).length >= 130, `${post.slug}: substantive English content`)
    assert.ok(post.content_ar.split(/\s+/).length >= 100, `${post.slug}: substantive Arabic content`)
    assert.ok(existsSync(`public${post.image_url}`), post.image_url)
    assert.ok(post.sources.length)
  }
})

test('article rendering escapes HTML and never turns author text into executable links', () => {
  const html = renderToStaticMarkup(createElement(BlogBody, { content: '## A safe heading\n\n<script>alert(1)</script>\n\n- [link](javascript:alert(1))' }))
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('<a '))
  assert.ok(html.includes('&lt;script&gt;'))
})

test('SEO uses distinct language canonicals, valid article dates, and raster social cards', () => {
  const post = { ...BLOG_STARTER_ARTICLES[0], id: '11111111-1111-4111-8111-111111111111', published_at: '2026-11-05T00:00:00Z', created_at: '2026-11-05T00:00:00Z', updated_at: '2026-11-05T00:00:00Z' }
  assert.equal(blogHref(post.slug, 'en'), `/blog/${post.slug}?lang=en`)
  assert.notEqual(blogMetadata(post, 'ar').alternates?.canonical, blogMetadata(post, 'en').alternates?.canonical)
  const structured = blogPostingJsonLd(post, 'ar')
  assert.equal(structured['@type'], 'BlogPosting')
  assert.equal(structured.inLanguage, 'ar')
  assert.equal(structured.datePublished, post.published_at)
  assert.match(structured.image[0], /\/api\/blog\/og\?slug=/)
  assert.equal(BlogPostInput.safeParse({ ...BLOG_STARTER_ARTICLES[0], image_url: 'javascript:alert(1)' }).success, false)
})

test('blog administration enforces access, publication URL stability, and concurrency', async (t) => {
  const oldFetch = globalThis.fetch
  const oldEnv = { ...process.env }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://blog-database.example.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test'
  const id = '11111111-1111-4111-8111-111111111111'
  const headers = { Authorization: 'Bearer admin-test', 'Content-Type': 'application/json' }
  let role = 'ADMIN'
  let mutationRequests = 0
  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (url.includes('/auth/v1/user')) return Response.json({ id, email: 'staff@example.test' })
    if (url.includes('/rest/v1/profiles')) return Response.json({ role })
    if (url.includes('/rest/v1/blog_posts')) {
      if (init?.method && init.method !== 'GET') { mutationRequests++; return Response.json([]) }
      if (url.includes('select=published_at')) return Response.json({ published_at: '2026-11-05T00:00:00Z', slug: BLOG_STARTER_ARTICLES[0].slug })
      return Response.json([])
    }
    throw new Error(`Unexpected request: ${url}`)
  }
  const request = (method: string, body?: unknown, auth = true) => new Request('https://store.test/api/admin/blog', { method, ...(auth ? { headers } : {}), ...(body ? { body: JSON.stringify(body) } : {}) })
  try {
    await t.test('anonymous users cannot read drafts, write, delete, or import', async () => {
      for (const [method, handler] of [['GET', GET], ['POST', POST], ['PATCH', PATCH], ['DELETE', DELETE], ['POST', importArticles]] as const) {
        assert.equal((await handler(request(method, undefined, false))).status, 401)
      }
      assert.equal(mutationRequests, 0)
    })
    await t.test('signed-in customers cannot import or publish', async () => {
      role = 'CASHIER'
      assert.equal((await POST(request('POST', BLOG_STARTER_ARTICLES[0]))).status, 403)
      assert.equal((await importArticles(request('POST'))).status, 403)
      assert.equal(mutationRequests, 0)
      role = 'ADMIN'
    })
    await t.test('staff reads are uncached and invalid drafts cannot be saved', async () => {
      assert.equal((await GET(request('GET'))).headers.get('Cache-Control'), 'private, no-store')
      assert.equal((await POST(request('POST', { ...BLOG_STARTER_ARTICLES[0], title_ar: '' }))).status, 400)
      assert.equal(mutationRequests, 0)
    })
    await t.test('published slugs stay stable', async () => {
      const response = await PATCH(request('PATCH', { id, expectedUpdatedAt: '2026-11-05T00:00:00Z', post: { ...BLOG_STARTER_ARTICLES[0], slug: 'new-slug' } }))
      assert.equal(response.status, 400)
      assert.equal(mutationRequests, 0)
    })
    await t.test('stale edits and deletes report a conflict', async () => {
      assert.equal((await PATCH(request('PATCH', { id, expectedUpdatedAt: '2026-11-05T00:00:00Z', post: BLOG_STARTER_ARTICLES[0] }))).status, 409)
      assert.equal((await DELETE(request('DELETE', { id, expectedUpdatedAt: '2026-11-05T00:00:00Z' }))).status, 409)
    })
  } finally {
    globalThis.fetch = oldFetch
    for (const key of Object.keys(process.env)) if (!(key in oldEnv)) delete process.env[key]
    Object.assign(process.env, oldEnv)
  }
})
