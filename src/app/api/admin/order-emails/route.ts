import { z } from 'zod'
import { requireAdmin } from '@/lib/require-admin'
import { sendOrderEmails } from '@/lib/send-order-emails'

export const maxDuration = 60

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if (admin instanceof Response) return admin
  const parsed = z.object({ orderId: z.string().uuid() }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'A valid order ID is required' }, { status: 400 })
  try {
    const result = await sendOrderEmails(parsed.data.orderId)
    return Response.json(result, { status: result.customerEmailError || result.adminEmailError ? 503 : 200 })
  } catch (error) {
    console.error('Admin email retry failed', { orderId: parsed.data.orderId, error })
    return Response.json({ error: 'Could not retry notifications. Automatic recovery will retry.' }, { status: 503 })
  }
}
