import { z } from 'zod'
import { createHostedPayment } from '@/lib/myfatoorah'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const RequestSchema = z.object({
  orderId: z.string().uuid(),
  language: z.enum(['ar', 'en']).default('ar'),
})

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid payment request' }, { status: 400 })

  try {
    const supabase = getSupabaseAdmin()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, guest_email, total, status, mf_invoice_id, mf_payment_url, shipping_address')
      .eq('id', parsed.data.orderId)
      .single()

    if (orderError || !order) return Response.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'pending') return Response.json({ error: 'Order is not payable' }, { status: 409 })
    if (order.mf_payment_url) return Response.json({ paymentUrl: order.mf_payment_url })

    const address = (order.shipping_address ?? {}) as Record<string, string>
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
    const payment = await createHostedPayment({
      amount: Number(order.total),
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: `${address.first_name ?? ''} ${address.last_name ?? ''}`.trim(),
      customerEmail: order.guest_email,
      language: parsed.data.language,
      redirectUrl: `${siteUrl.replace(/\/$/, '')}/api/payments/callback`,
      webhookUrl: process.env.MYFATOORAH_WEBHOOK_SECRET
        ? `${siteUrl.replace(/\/$/, '')}/api/myfatoorah/webhook`
        : undefined,
    })

    await supabase
      .from('orders')
      .update({
        mf_invoice_id:  payment.InvoiceId,
        mf_payment_url: payment.PaymentURL,
      })
      .eq('id', order.id)
      .eq('status', 'pending')

    return Response.json({ paymentUrl: payment.PaymentURL })
  } catch (error) {
    console.error('Failed to create MyFatoorah payment', error)
    return Response.json({ error: 'Could not start payment' }, { status: 502 })
  }
}
