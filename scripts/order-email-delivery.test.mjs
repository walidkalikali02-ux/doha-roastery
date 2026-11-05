import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deliverOrderEmail } from '../src/lib/order-email-delivery.ts'

const accepted = { data: { id: 'email-1' }, error: null }
const noWait = async () => {}

test('does not send again when this recipient is already notified', async () => {
  const result = await deliverOrderEmail({
    notifiedAt: '2026-10-25T12:00:00Z',
    send: async () => { assert.fail('must not send') },
    markSent: async () => { assert.fail('must not update') },
  })
  assert.deepEqual(result, { sent: true, newlySent: false })
})

test('retries rate limits and records success only after provider acceptance', async () => {
  let sends = 0
  let writes = 0
  const delays = []
  const result = await deliverOrderEmail({
    notifiedAt: null,
    send: async () => {
      sends++
      assert.equal(writes, 0)
      return sends < 3
        ? { data: null, error: { message: 'Rate limited', statusCode: 429 } }
        : accepted
    },
    markSent: async () => { writes++ },
    wait: async (ms) => { delays.push(ms) },
  })
  assert.equal(result.sent, true)
  assert.equal(sends, 3)
  assert.equal(writes, 1)
  assert.deepEqual(delays, [1000, 2000])
})

test('a failed provider request remains unnotified for later recovery', async () => {
  let sends = 0
  const result = await deliverOrderEmail({
    notifiedAt: null,
    send: async () => { sends++; throw new Error('Network unavailable') },
    markSent: async () => { assert.fail('must not mark failed email') },
    wait: noWait,
  })
  assert.equal(sends, 3)
  assert.equal(result.sent, false)
  assert.equal(result.error, 'Network unavailable')
})

test('database failures retry the write without resending an accepted email', async () => {
  let sends = 0
  let writes = 0
  const result = await deliverOrderEmail({
    notifiedAt: null,
    send: async () => { sends++; return accepted },
    markSent: async () => { if (++writes < 3) throw new Error('Database unavailable') },
    wait: noWait,
  })
  assert.equal(result.sent, true)
  assert.equal(sends, 1)
  assert.equal(writes, 3)
})

test('permanent provider validation errors do not retry or mark success', async () => {
  let sends = 0
  const result = await deliverOrderEmail({
    notifiedAt: null,
    send: async () => {
      sends++
      return { data: null, error: { message: 'Invalid recipient', statusCode: 422 } }
    },
    markSent: async () => { assert.fail('must not mark success') },
    wait: noWait,
  })
  assert.equal(sends, 1)
  assert.equal(result.error, 'Invalid recipient')
})

test('a customer failure does not prevent independent admin delivery', async () => {
  const customer = await deliverOrderEmail({
    notifiedAt: null,
    send: async () => ({ data: null, error: { message: 'Invalid email', statusCode: 422 } }),
    markSent: async () => { assert.fail('customer must remain unnotified') },
    wait: noWait,
  })
  let adminMarked = false
  const admin = await deliverOrderEmail({
    notifiedAt: null,
    send: async () => accepted,
    markSent: async () => { adminMarked = true },
    wait: noWait,
  })
  assert.equal(customer.sent, false)
  assert.equal(admin.sent, true)
  assert.equal(adminMarked, true)
})
