import { expect, test, type Page } from '@playwright/test'
import { BLOG_STARTER_ARTICLES } from '../src/lib/blog-seed'

async function adminSession(page: Page) {
  const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  const id = '11111111-1111-4111-8111-111111111111'
  const user = { id, aud: 'authenticated', role: 'authenticated', email: 'editor@example.test', app_metadata: {}, user_metadata: {} }
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.test`
  await page.addInitScript(({ key, session }) => {
    localStorage.setItem('doha_lang', 'en')
    localStorage.setItem(key, JSON.stringify(session))
  }, { key: `sb-${project}-auth-token`, session: { access_token: token, refresh_token: 'test', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user } })
  await page.route('https://*.supabase.co/**', (route) => route.fulfill({ json: route.request().url().includes('/rest/v1/profiles') ? { id, full_name: 'Test Editor', role: 'ADMIN' } : route.request().url().includes('/auth/v1/') ? user : [] }))
  await page.routeWebSocket(/supabase\.co/, (socket) => socket.close())
}

test('journal renders Arabic/English article SEO, illustrations, filters, and mobile layout', async ({ page }) => {
  await page.goto('/blog?lang=en')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Every bean.')
  await page.getByRole('link', { name: 'Coffee species', exact: true }).click()
  await expect(page.locator('main article')).toHaveCount(4)
  await page.getByRole('heading', { name: 'Arabica coffee: diversity behind the name' }).getByRole('link').click()
  await expect(page).toHaveURL(/\/blog\/arabica-coffee\?lang=en$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Arabica coffee: diversity behind the name')
  await expect(page.locator('main')).toHaveAttribute('lang', 'en')
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/blog\/arabica-coffee\?lang=en$/)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  const structured = await page.locator('script[type="application/ld+json"]').allTextContents()
  expect(structured.some((text) => JSON.parse(text)['@type'] === 'BlogPosting')).toBeTruthy()
  await page.getByRole('link', { name: 'اقرأ بالعربية' }).click()
  await expect(page.locator('main')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('قهوة أرابيكا: التنوع وراء الاسم')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
  const hero = page.locator('figure img')
  await expect(hero).toBeVisible()
  expect(await hero.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
})

test('journal serves a raster social image, rejects unknown articles, and protects admin API', async ({ request }) => {
  const image = await request.get('/api/blog/og?slug=arabica-coffee')
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toContain('image/png')
  expect((await request.get('/blog/unknown-unpublished-article')).status()).toBe(404)
  expect((await request.get('/api/admin/blog')).status()).toBe(401)
  expect((await request.post('/api/admin/blog/import')).status()).toBe(401)
})

test('blog editor saves draft, publishes, previews both languages, and preserves the saved version', async ({ page }) => {
  await adminSession(page)
  const post = { ...BLOG_STARTER_ARTICLES[1], id: '11111111-1111-4111-8111-111111111111', status: 'draft', published_at: null as string | null, created_at: '2026-11-05T00:00:00Z', updated_at: '2026-11-05T00:00:00Z' }
  const writes: Array<{ post: typeof post; expectedUpdatedAt: string }> = []
  await page.route('**/api/admin/blog', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON()
      writes.push(body)
      Object.assign(post, body.post, { updated_at: '2026-11-05T01:00:00Z', published_at: body.post.status === 'published' ? '2026-11-05T01:00:00Z' : null })
      await route.fulfill({ json: { data: post } })
    } else await route.fulfill({ json: { data: [post] } })
  })
  await page.goto('/admin/blog')
  await page.getByRole('button', { name: 'Edit Arabica coffee: diversity behind the name', exact: true }).click()
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await page.getByLabel('Title *').fill('Arabica: an edited journal story')
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Arabica: an edited journal story' })).toBeVisible()
  await page.getByRole('button', { name: 'العربية', exact: true }).click()
  await expect(page.getByRole('heading', { name: BLOG_STARTER_ARTICLES[1].title_ar })).toBeVisible()
  await page.getByRole('button', { name: 'Save draft', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Draft saved. It is not visible to visitors.')
  expect(writes[0].post.title_en).toBe('Arabica: an edited journal story')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Status', { exact: true }).selectOption('published')
  await page.getByRole('button', { name: 'Save & publish', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Article published. Journal and sitemap updated.')
  expect(writes[1].expectedUpdatedAt).toBe('2026-11-05T01:00:00Z')
  await expect(page.getByLabel('URL slug *')).toBeDisabled()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Arabica: an edited journal story' })).toBeVisible()
})
