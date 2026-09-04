import { createHmac, timingSafeEqual } from 'node:crypto'
import { getPaymentDetails } from '@/lib/myfatoorah'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { sendOrderEmails } from '@/lib/send-order-emails'

// MyFatoorah v2 webhook payload shape
type PaymentWebhook = {
  Event?: { Code?: number; Name?: string }
  Data?: {
    Invoice?: {
      Id?: string
      Status?: string
      ExternalIdentifier?: string | null
    }
    Transaction?: {
      Status?: string
      PaymentId?: string
      Id?: string
    }
    Amount?: {
      ValueInDisplayCurrency?: string | number
      DisplayCurrency?: string
    }
  }
}

function text(value: unknown) {
  return value == null ? '' : String(value)
}

function signatureData(data: NonNullable<PaymentWebhook['Data']>) {
  const invoice     = data.Invoice     ?? {}
  const transaction = data.Transaction ?? {}
  return [
    `Invoice.Id=${text(invoice.Id)}`,
    `Invoice.Status=${text(invoice.Status)}`,
    `Transaction.Status=${text(transaction.Status)}`,
    `Transaction.PaymentId=${text(transaction.PaymentId)}`,
    `Invoice.ExternalIdentifier=${text(invoice.ExternalIdentifier)}`,
  ].join(',')
}

function signaturesMatch(actual: string, data: NonNullable<PaymentWebhook['Data']>, secret: string) {
  const expected = createHmac('sha256', secret).update(signatureData(data), 'utf8').digest('base64')
  const a = Buffer.from(actual)
  const e = Buffer.from(expected)
  return a.length === e.length && timingSafeEqual(a, e)
}

export async function POST(request: Request) {
  const secret = process.env.MYFATOORAH_WEBHOOK_SECRET
  if (!secret) return Response.json({ error: 'Webhook is not configured' }, { status: 503 })

  const rawBody  = await request.text()
  const signature = request.headers.get('myfatoorah-signature')
  if (!signature) return Response.json({ error: 'Missing signature' }, { status: 401 })

  let payload: PaymentWebhook
  try {
    payload = JSON.parse(rawBody) as PaymentWebhook
  } catch {
    return Response.json({ error: 'Invalid webhook payload' }, { status: 400 })
  }

  const data = payload.Data
  if (!data || !signaturesMatch(signature, data, secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (payload.Event?.Code !== 1 && payload.Event?.Name !== 'PAYMENT_STATUS_CHANGED') {
    return Response.json({ ok: true })
  }

  const invoice     = data.Invoice     ?? {}
  const transaction = data.Transaction ?? {}
  const supabase    = getSupabaseAdmin()

  let { data: order } = await supabase
    .from('orders')
    .select('id, order_number, total, status')
    .eq('mf_invoice_id', String(invoice.Id ?? ''))
    .maybeSingle()

  if (!order && invoice.ExternalIdentifier) {
    const result = await supabase
      .from('orders')
      .select('id, order_number, total, status')
      .eq('id', invoice.ExternalIdentifier)
      .maybeSingle()
    order = result.data
  }

  if (!order) return Response.json({ ok: true })

  // Webhook tells us intent; re-verify directly from MyFatoorah API for paid transactions
  let paid = invoice.Status === 'PAID' && transaction.Status === 'SUCCESS'

  if (paid && transaction.PaymentId) {
    const verified = await getPaymentDetails(transaction.PaymentId)
    const vTx = verified?.InvoiceTransactions?.[0]
    paid = verified?.InvoiceStatus === 'Paid' &&
           (vTx?.TransactionStatus === 'Succss' || vTx?.TransactionStatus === 'Success')

    if (!paid) {
      console.error('MyFatoorah webhook and direct verification disagree', {
        orderId: order.id,
        paymentId: transaction.PaymentId,
        invoiceStatus: verified?.InvoiceStatus,
        transactionStatus: vTx?.TransactionStatus,
      })
      return Response.json({ ok: true })
    }
  }

  const failed = invoice.Status === 'CANCELED' ||
                 transaction.Status === 'FAILED' ||
                 transaction.Status === 'CANCELED'

  const status = order.status === 'paid'
    ? 'paid'
    : paid   ? 'paid'
    : failed ? 'payment_failed'
    : order.status

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      ...(invoice.Id          ? { mf_invoice_id:  String(invoice.Id)          } : {}),
      ...(transaction.PaymentId ? { mf_payment_id: String(transaction.PaymentId) } : {}),
    })
    .eq('id', order.id)

  if (error) {
    console.error('Could not update order from MyFatoorah webhook', error)
    return Response.json({ error: 'Could not update order' }, { status: 500 })
  }

  // Fire notification whenever the order just became paid. sendOrderEmails
  // uses independent atomic claims per recipient (customer + admin), so if the
  // browser callback beats us to one, only the other is sent — no duplicates.
  if (paid) {
    await sendOrderEmails(order.id).catch((e) =>
      console.error('Order emails failed from webhook', e),
    )
  }

  return Response.json({ ok: true })
}
