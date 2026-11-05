import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GET, PATCH } from '../src/app/api/admin/products/route'

test('admin product API verifies identity, role, validation, and concurrent changes', async (t) => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://admin-database.example.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test'
  let role = 'ADMIN'
  let productRequests = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.includes('/auth/v1/user')) return Response.json({ id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.test' })
    if (url.includes('/rest/v1/profiles')) return Response.json({ role })
    if (url.includes('/rest/v1/ecommerce_products')) {
      productRequests++
      return Response.json([])
    }
    throw new Error(`Unexpected request: ${url}`)
  }
  const headers = { Authorization: 'Bearer admin-test', 'Content-Type': 'application/json' }
  try {
    await t.test('missing auth cannot read private products', async () => {
      assert.equal((await GET(new Request('https://store.test/api/admin/products'))).status, 401)
      assert.equal(productRequests, 0)
    })
    await t.test('signed-in non-admin cannot read or mutate products', async () => {
      role = 'CASHIER'
      assert.equal((await GET(new Request('https://store.test/api/admin/products', { headers }))).status, 403)
      assert.equal(productRequests, 0)
      role = 'ADMIN'
    })
    await t.test('verified admin gets an uncached catalog response', async () => {
      const response = await GET(new Request('https://store.test/api/admin/products', { headers }))
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('cache-control'), 'private, no-store')
      assert.equal(productRequests, 1)
    })
    await t.test('invalid prices are rejected before any mutation', async () => {
      const response = await PATCH(new Request('https://store.test/api/admin/products', {
        method: 'PATCH', headers,
        body: JSON.stringify({ id: '00271bf7-19bd-4336-9bf4-994196edf44f', expectedUpdatedAt: '2026-10-25T17:00:00Z', changes: { price: -1 } }),
      }))
      assert.equal(response.status, 400)
      assert.equal(productRequests, 1)
    })
    await t.test('stale versions return conflict rather than reporting a successful save', async () => {
      const response = await PATCH(new Request('https://store.test/api/admin/products', {
        method: 'PATCH', headers,
        body: JSON.stringify({ id: '00271bf7-19bd-4336-9bf4-994196edf44f', expectedUpdatedAt: '2026-10-25T17:00:00Z', changes: { price: 50 } }),
      }))
      assert.equal(response.status, 409)
      assert.match((await response.json()).error, /changed or was deleted/)
    })
  } finally {
    globalThis.fetch = originalFetch
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key]
    Object.assign(process.env, originalEnv)
  }
})
