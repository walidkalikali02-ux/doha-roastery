import { z } from 'zod'
import { sendOrderEmails } from '@/lib/send-order-emails'

export const maxDuration = 60

const Schema = z.object({
  orderId: z.string().uuid(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'orderId (UUID) is required' }, { status: 400 })
  }

  try {
    const result = await sendOrderEmails(parsed.data.orderId)
    return Response.json(result, {
      status: result.customerEmailError || result.adminEmailError ? 503 : 200,
    })
  } catch (error) {
    console.error('Order email notification failed', error)
    return Response.json({ error: 'Email notification pending retry' }, { status: 503 })
  }
}
