import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sendOrderEmails } from '../src/lib/send-order-emails'
import { GET as recoverEmails } from '../src/app/api/cron/order-emails/route'

test('order email integration', async (t) => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://database.example.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role'
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.RESEND_FROM_EMAIL = 'orders@example.test'
  process.env.STORE_OWNER_EMAIL = 'admin@example.test'
  process.env.CALLMEBOT_TARGETS = ''
  process.env.CRON_SECRET = 'test-cron-secret'

  const order = {
    id: 'ade96624-2f20-4bb3-95a5-7550246ad36f', order_number: '1085',
    guest_email: 'customer@example.test', status: 'pending',
    subtotal: 150, discount_amount: 0, shipping_cost: 10, total: 160,
    shipping_address: { payment_method: 'card', first_name: 'Customer' },
    mf_invoice_id: 'invoice-1', mf_payment_id: null,
    created_at: '2026-10-25T16:00:00Z',
    customer_email_notified_at: null as string | null,
    admin_email_notified_at: null as string | null,
  }
  const sent = new Map<string, Record<string, unknown>>()
  let rejectCustomer = false
  let databaseError = false
  let requests = 0

  globalThis.fetch = async (input, options) => {
    requests++
    const url = String(input)
    if (url.startsWith('https://api.resend.com/emails')) {
      const body = JSON.parse(String(options?.body))
      const key = new Headers(options?.headers).get('idempotency-key')
      assert.ok(key, 'every send must have a stable idempotency key')
      if (rejectCustomer && body.to[0] === order.guest_email) {
        return Response.json({ name: 'validation_error', message: 'Invalid recipient', statusCode: 422 }, { status: 422 })
      }
      if (!sent.has(key)) sent.set(key, body)
      return Response.json({ id: key })
    }
    if (url.includes('/rest/v1/orders') && options?.method === 'PATCH') {
      const update = JSON.parse(String(options.body))
      for (const column of Object.keys(update)) {
        const recipient = column.startsWith('customer') ? 'customer' : 'admin'
        assert.ok(sent.has(`order/${order.id}/${recipient}`), 'never persist notification before provider acceptance')
      }
      return new Response(null, { status: 204 })
    }
    if (url.includes('/rest/v1/orders')) {
      if (databaseError) return Response.json({ message: 'Database unavailable' }, { status: 503 })
      if (new URL(url).searchParams.get('select') === 'id') return Response.json([])
      return Response.json(order)
    }
    if (url.includes('/rest/v1/order_items')) {
      return Response.json([{ product_name: 'Coffee', variant_name: null, quantity: 1, unit_price: 150, total_price: 150 }])
    }
    throw new Error(`Unexpected request: ${url}`)
  }

  try {
    await t.test('pending card order sends to both recipients with accurate payment copy', async () => {
      const result = await sendOrderEmails(order.id)
      assert.equal(result.customerEmailSent, true)
      assert.equal(result.adminEmailSent, true)
      const customer = sent.get(`order/${order.id}/customer`)!
      assert.match(String(customer.subject), /Order received #1085/)
      assert.match(String(customer.html), /Awaiting Payment/)
      assert.match(String(customer.html), /بانتظار الدفع/)
      assert.doesNotMatch(String(customer.html), /is being prepared for delivery/)
      assert.match(String(sent.get(`order/${order.id}/admin`)?.html), /Pending/)
    })

    await t.test('concurrent callback and webhook share recipient idempotency keys', async () => {
      sent.clear()
      await Promise.all([sendOrderEmails(order.id), sendOrderEmails(order.id)])
      assert.equal(sent.size, 2, 'provider receives only two distinct operations')
    })

    await t.test('customer rejection still sends the admin email', async () => {
      sent.clear()
      rejectCustomer = true
      const result = await sendOrderEmails(order.id)
      assert.equal(result.customerEmailSent, false)
      assert.equal(result.customerEmailError, 'Invalid recipient')
      assert.equal(result.adminEmailSent, true)
      rejectCustomer = false
    })

    await t.test('already notified recipients are not sent again', async () => {
      sent.clear()
      order.customer_email_notified_at = order.admin_email_notified_at = '2026-10-25T17:00:00Z'
      const result = await sendOrderEmails(order.id)
      assert.equal(result.customerEmailSent, true)
      assert.equal(result.adminEmailSent, true)
      assert.equal(sent.size, 0)
    })

    await t.test('database errors are surfaced instead of reported as successful skips', async () => {
      databaseError = true
      await assert.rejects(() => sendOrderEmails(order.id), /Could not load order/)
      databaseError = false
    })

    await t.test('unauthorized cron invocation cannot read orders or send mail', async () => {
      requests = 0
      const response = await recoverEmails(new Request('https://store.example.test/api/cron/order-emails'))
      assert.equal(response.status, 401)
      assert.equal(requests, 0)
    })

    await t.test('authenticated recovery checks the persisted queue and returns its result', async () => {
      requests = 0
      const response = await recoverEmails(new Request('https://store.example.test/api/cron/order-emails', {
        headers: { Authorization: 'Bearer test-cron-secret' },
      }))
      assert.equal(response.status, 200)
      assert.deepEqual(await response.json(), { processed: 0, failed: 0 })
      assert.equal(requests, 1)
    })
  } finally {
    globalThis.fetch = originalFetch
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key]
    }
    Object.assign(process.env, originalEnv)
  }
})
