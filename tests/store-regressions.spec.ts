import { expect, test, type Page } from '@playwright/test'

const productId = '00271bf7-19bd-4336-9bf4-994196edf44f'
const userId = '11111111-1111-4111-8111-111111111111'
const product = {
  id: productId, name: 'Regression Coffee', name_ar: 'قهوة اختبار', sku: 'TEST',
  category: 'Coffee Beans', description: 'Coffee description', description_ar: 'وصف القهوة',
  price: 25, compare_at_price: null as number | null, cost_per_item: null,
  quantity: 100, low_stock_threshold: 10, status: 'active', image_url: null,
  tags: [], in_stock: true, weight: '250g',
  created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-25T17:00:00Z',
}

async function seedSession(page: Page, withCart = false) {
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'account@example.test', app_metadata: {}, user_metadata: {} }
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.test`
  await page.addInitScript(({ key, session, cart }) => {
    localStorage.setItem('doha_lang', 'en')
    localStorage.setItem(key, JSON.stringify(session))
    if (cart && !sessionStorage.getItem('cart-seeded')) {
      localStorage.setItem('doha_cart_v2', JSON.stringify(cart))
      sessionStorage.setItem('cart-seeded', '1')
    }
  }, {
    key: `sb-${supabaseHost}-auth-token`,
    session: { access_token: accessToken, refresh_token: 'test-refresh', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer', user },
    cart: withCart ? [{ id: productId, cartKey: `${productId}-filter`, name: 'Old coffee', price: 10, weight: '100g', grind: 'filter', notes: '', image_url: null, quantity: 2 }] : null,
  })
  // All browser Supabase traffic is mocked: these tests never mutate live data.
  await page.route('https://*.supabase.co/**', async (route) => {
    if (route.request().url().includes('/rest/v1/profiles')) {
      await route.fulfill({ json: { id: userId, full_name: 'Test Admin', role: 'ADMIN', avatar_url: null } })
    } else if (route.request().url().includes('/auth/v1/')) {
      await route.fulfill({ json: user })
    } else {
      await route.fulfill({ json: [] })
    }
  })
  await page.routeWebSocket(/supabase\.co/, (socket) => socket.close())
}

test('signed-in admin can load and save products without an auth deadlock; edits survive reload', async ({ page }) => {
  await seedSession(page)
  let saved = { ...product }
  const patches: Array<{ changes: Record<string, unknown>; expectedUpdatedAt: string }> = []
  await page.route('**/api/admin/products', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON()
      patches.push(body)
      saved = { ...saved, ...body.changes, updated_at: '2026-10-25T18:00:00Z' }
      await route.fulfill({ json: { data: saved } })
    } else {
      await route.fulfill({ json: { data: [saved] } })
    }
  })
  await page.goto('/admin/products')
  await page.getByRole('button', { name: 'Edit Regression Coffee', exact: true }).click()
  await page.getByRole('spinbutton').nth(0).fill('84.75')
  await page.getByRole('spinbutton').nth(1).fill('100')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Product saved and storefront updated')
  expect(patches[0]).toEqual({ id: productId, expectedUpdatedAt: product.updated_at, changes: { price: 84.75, compare_at_price: 100 } })
  await page.reload()
  await expect(page.getByRole('cell', { name: '84.75 QAR' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit Regression Coffee', exact: true }).click()
  await page.getByRole('spinbutton').nth(1).fill('')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('status')).toBeVisible()
  expect(patches[1].changes).toEqual({ compare_at_price: null })
})

test('checkout refreshes stored prices and submits the explicitly entered email for a signed-in customer', async ({ page }) => {
  await seedSession(page, true)
  await page.route('**/api/products?*', (route) => route.fulfill({ json: { data: [product] } }))
  let submitted: { email: string; items: Array<{ quantity: number }> } | null = null
  await page.route('**/api/orders', async (route) => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ status: 201, json: { order_id: userId, order_number: 'TEST-ORDER' } })
  })
  await page.goto('/checkout')
  const email = page.locator('input[type="email"]')
  await expect(email).toHaveValue('account@example.test')
  await email.fill('  Customer.Orders@Example.test  ')
  const fields = page.locator('input[type="text"]')
  await fields.nth(0).fill('Customer')
  await fields.nth(1).fill('Name')
  await page.locator('input[type="tel"]').fill('97412345678')
  await page.getByRole('button', { name: 'Next: Shipping' }).click()
  await page.locator('input[type="text"]').nth(0).fill('District')
  await page.locator('input[type="text"]').nth(1).fill('Doha')
  await page.locator('input[type="text"]').nth(2).fill('Street 1')
  await page.locator('select').selectOption('doha')
  await page.getByRole('button', { name: 'Next: Review' }).click()
  await expect(page.getByText('60.00', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Place Order', exact: true }).click()
  await expect(page).toHaveURL(/checkout\/success\?order=TEST-ORDER/, { timeout: 20_000 })
  expect(submitted).toMatchObject({ email: 'customer.orders@example.test', items: [{ product_id: productId, quantity: 2 }] })
})

test('cart detects changed prices and unpublished products when returning to the tab', async ({ page }) => {
  await seedSession(page, true)
  let current = [{ ...product }]
  await page.route('**/api/products?*', (route) => route.fulfill({ json: { data: current } }))
  await page.goto('/cart')
  await expect(page.getByText('25.00', { exact: true })).toBeVisible()
  current = [{ ...product, price: 35.5 }]
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByText('35.50', { exact: true })).toBeVisible()
  current = []
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('alert').filter({ hasText: 'Unavailable in this quantity' })).toBeVisible()
})

test('admin sees recipient email tracking and can retry a missing notification', async ({ page }) => {
  await seedSession(page)
  const order = {
    id: userId, order_number: '2001', status: 'pending', guest_email: 'customer@example.test',
    shipping_address: { first_name: 'Customer', last_name: 'Name', payment_method: 'cod' },
    subtotal: 50, discount_amount: 0, shipping_cost: 10, total: 60,
    created_at: '2026-10-25T17:00:00Z', customer_email_notified_at: '2026-10-25T17:01:00Z',
    admin_email_notified_at: null as string | null,
  }
  await page.route('**/api/admin/orders*', (route) => route.fulfill({ json: { data: route.request().url().includes('?id=') ? [] : [order] } }))
  await page.route('**/api/admin/order-emails', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ orderId: userId })
    order.admin_email_notified_at = '2026-10-25T17:02:00Z'
    await route.fulfill({ json: { customerEmailSent: true, adminEmailSent: true } })
  })
  await page.goto('/admin/orders')
  await page.getByRole('button').filter({ hasText: '#2001' }).click()
  await expect(page.getByText('Customer: Sent to email provider', { exact: true })).toBeVisible()
  const retry = page.getByRole('button', { name: 'Retry unrecorded notifications' })
  await retry.click()
  await expect(page.getByText('Admin: Sent to email provider', { exact: true })).toBeVisible()
  await expect(retry).toHaveCount(0)
})
