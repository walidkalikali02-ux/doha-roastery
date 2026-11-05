import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// Explicit operational check, not part of npm test. Uses a temporary draft
// product and a short-lived admin session; no customer orders/emails are created.
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const site = process.env.LIVE_SITE_URL ?? 'https://www.doharoastery.com'
let token
let draftId

async function api(path, method = 'GET', body) {
  const response = await fetch(`${site}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30_000),
  })
  return { status: response.status, body: await response.json() }
}

try {
  const denied = await fetch(`${site}/api/admin/products`)
  assert.equal(denied.status, 401)
  const { data: profile, error: profileError } = await service.from('profiles').select('id').eq('role', 'ADMIN').limit(1).single()
  if (profileError) throw profileError
  const { data: { user }, error: userError } = await service.auth.admin.getUserById(profile.id)
  if (userError || !user?.email) throw userError ?? new Error('No admin account available')
  const { data: link, error: linkError } = await service.auth.admin.generateLink({ type: 'magiclink', email: user.email })
  if (linkError) throw linkError
  const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: verified, error: verifyError } = await auth.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (verifyError || !verified.session) throw verifyError ?? new Error('Could not start verification session')
  token = verified.session.access_token

  const created = await api('/api/admin/products', 'POST', {
    name: `Draft verification ${randomUUID()}`, name_ar: 'تحقق مؤقت غير منشور',
    sku: `VERIFY-${randomUUID()}`, category: 'Tools', description: 'Temporary draft verification', description_ar: 'تحقق مؤقت',
    price: 25, compare_at_price: 50, cost_per_item: null, quantity: 0, low_stock_threshold: 5,
    status: 'draft', image_url: null, tags: [], in_stock: false, weight: '',
  })
  assert.equal(created.status, 201, created.body.error)
  draftId = created.body.data.id
  const initialVersion = created.body.data.updated_at
  const updated = await api('/api/admin/products', 'PATCH', {
    id: draftId, expectedUpdatedAt: initialVersion,
    changes: { price: 27.75, compare_at_price: null, description_ar: 'تم التحقق من حفظ التعديل' },
  })
  assert.equal(updated.status, 200, updated.body.error)
  assert.equal(updated.body.data.price, 27.75)
  assert.equal(updated.body.data.compare_at_price, null)
  const stale = await api('/api/admin/products', 'PATCH', { id: draftId, expectedUpdatedAt: initialVersion, changes: { price: 99 } })
  assert.equal(stale.status, 409)

  const list = await api('/api/admin/products')
  const stored = list.body.data.find((product) => product.id === draftId)
  assert.equal(stored.price, 27.75)
  assert.equal(stored.description_ar, 'تم التحقق من حفظ التعديل')
  const { data: row, error: rowError } = await service.from('ecommerce_products').select('price,compare_at_price,description_ar').eq('id', draftId).single()
  if (rowError) throw rowError
  assert.deepEqual(row, { price: 27.75, compare_at_price: null, description_ar: 'تم التحقق من حفظ التعديل' })
  const hidden = await api(`/api/products?ids=${draftId}`)
  assert.deepEqual(hidden.body.data, [])
  assert.equal((await fetch(`${site}/products/${draftId}`)).status, 404)

  const deleted = await api('/api/admin/products', 'DELETE', { ids: [draftId] })
  assert.equal(deleted.status, 200)
  assert.ok(deleted.body.data.some((product) => product.id === draftId))
  draftId = undefined

  const { data: active, error: activeError } = await service.from('ecommerce_products').select('id,price').eq('status', 'active').limit(1).single()
  if (activeError) throw activeError
  const publicCatalog = await api(`/api/products?ids=${active.id}`)
  assert.equal(publicCatalog.body.data[0].price, active.price)
  const html = await (await fetch(`${site}/products/${active.id}`)).text()
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1])).find((value) => value['@type'] === 'Product')
  assert.equal(Number(jsonLd?.offers?.price), active.price)
  console.log('Live verification passed: authenticated create/update/read/delete, stale-edit rejection, draft visibility, and storefront prices matching the database.')
} finally {
  if (draftId) {
    const { error } = await service.from('ecommerce_products').delete().eq('id', draftId)
    if (error) console.error('Draft verification cleanup failed:', error.message)
  }
  if (token) {
    const { error } = await service.auth.admin.signOut(token, 'local')
    if (error) console.error('Verification session cleanup failed:', error.message)
  }
}
