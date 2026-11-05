import { timingSafeEqual } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendOrderEmails } from '@/lib/send-order-emails'

export const maxDuration = 120

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return Response.json({ error: 'Cron is not configured' }, { status: 503 })
  const actual = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The orders themselves are the durable recovery queue. Only recent orders
  // are retried, avoiding a replay of historical emails from before tracking.
  const recoveryStart = process.env.ORDER_EMAIL_RECOVERY_SINCE?.trim() || undefined
  const since = recoveryStart ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  if (!Number.isFinite(Date.parse(since))) return Response.json({ error: 'Invalid recovery start date' }, { status: 503 })
  const { data: orders, error } = await getSupabaseAdmin()
    .from('orders')
    .select('id')
    .gte('created_at', since)
    .in('status', ['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered'])
    .or('customer_email_notified_at.is.null,admin_email_notified_at.is.null')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Could not load order email recovery queue', error)
    return Response.json({ error: 'Could not load pending notifications' }, { status: 503 })
  }

  const deadline = Date.now() + 90_000
  let processed = 0
  let failed = 0
  for (const order of orders ?? []) {
    if (Date.now() > deadline) break
    try {
      const result = await sendOrderEmails(order.id)
      if (result.customerEmailError || result.adminEmailError) {
        failed++
        console.error('Order email recovery failed', { orderId: order.id, ...result })
      }
    } catch (error) {
      failed++
      console.error('Order email recovery failed', { orderId: order.id, error })
    }
    processed++
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return Response.json({ processed, failed }, { status: failed ? 503 : 200 })
}
