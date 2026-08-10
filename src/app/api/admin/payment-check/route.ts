import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getPaymentDetails } from '@/lib/myfatoorah'

export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get('order')
  if (!orderNumber) return Response.json({ error: 'Missing ?order=' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, status, total, mf_invoice_id, mf_payment_url, guest_email, created_at')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

  const apiUrl = process.env.MYFATOORAH_API_URL ?? '(not set — defaulting to TEST)'
  const hasKey = !!process.env.MYFATOORAH_API_KEY

  let paymentDetails = null
  let paymentError = null
  if (order.mf_invoice_id) {
    try {
      paymentDetails = await getPaymentDetails(order.mf_invoice_id)
    } catch (e) {
      paymentError = (e as Error).message
    }
  }

  return Response.json({
    env: {
      MYFATOORAH_API_URL: apiUrl,
      MYFATOORAH_API_KEY_SET: hasKey,
      isTestMode: apiUrl.includes('apitest'),
    },
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      mf_invoice_id: order.mf_invoice_id,
      mf_payment_url: order.mf_payment_url,
      guest_email: order.guest_email,
      created_at: order.created_at,
    },
    paymentDetails,
    paymentError,
  })
}
