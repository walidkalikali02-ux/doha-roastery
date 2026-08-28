import { getPaymentDetails } from '@/lib/myfatoorah'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function resultUrl(request: Request, status: string, orderNumber?: string) {
  const url = new URL('/checkout/success', request.url)
  if (orderNumber) url.searchParams.set('order', orderNumber)
  url.searchParams.set('payment', status)
  return Response.redirect(url)
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const paymentId = query.get('paymentId') ?? query.get('PaymentId') ?? query.get('Id')
  if (!paymentId || paymentId.length > 100) return resultUrl(request, 'error')

  try {
    const payment = await getPaymentDetails(paymentId)

    // v2 API uses InvoiceStatus + InvoiceTransactions
    const invoiceStatus = payment?.InvoiceStatus
    const transaction   = payment?.InvoiceTransactions?.[0]
    const orderId       = payment?.UserDefinedField  // stored in UserDefinedField on create

    console.info('MYFATOORAH_CALLBACK', {
      paymentId,
      invoiceStatus,
      transactionStatus: transaction?.TransactionStatus,
      transactionError:  transaction?.Error ?? null,
      orderId,
    })

    const supabase = getSupabaseAdmin()

    let { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('mf_invoice_id', String(payment?.InvoiceId ?? ''))
      .maybeSingle()

    if (!order && orderId) {
      const result = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
      order = result.data
    }

    if (!order) return resultUrl(request, 'error')

    // MyFatoorah v2: success = InvoiceStatus "Paid" + TransactionStatus "Succss" (their typo)
    const paid   = invoiceStatus === 'Paid' &&
                   (transaction?.TransactionStatus === 'Succss' || transaction?.TransactionStatus === 'Success')
    const failed = invoiceStatus === 'Failed' || invoiceStatus === 'Expired' ||
                   transaction?.TransactionStatus === 'Failed'

    const status = order.status === 'paid'
      ? 'paid'
      : paid   ? 'paid'
      : failed ? 'payment_failed'
      : order.status

    await supabase
      .from('orders')
      .update({ status, mf_payment_id: paymentId })
      .eq('id', order.id)

    if (paid) {
      // Notification API is idempotent (dedups via orders.email_notified_at),
      // so it's safe to call regardless of whether the webhook already fired.
      // Passing just { orderId } lets the API load everything fresh from DB.
      await fetch(new URL('/api/order-notification', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      }).catch((e) => console.error('Order notification failed', e))
    }

    return resultUrl(
      request,
      status === 'paid' ? 'paid' : failed ? 'failed' : 'pending',
      order.order_number,
    )
  } catch (error) {
    console.error('Failed to verify MyFatoorah payment', { paymentId, error })
    return resultUrl(request, 'error')
  }
}
