import { Resend } from 'resend'
import { z } from 'zod'
import { DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN } from '@/lib/display-text'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// CallMeBot free WhatsApp: one-time activation per phone (see README of
// integration). Multiple numbers can be notified — comma-separated pairs of
// "<phone>:<apikey>" in CALLMEBOT_TARGETS, e.g.
//   CALLMEBOT_TARGETS="+97433224627:1234567,+97455555555:7654321"
async function notifyWhatsApp(text: string) {
  const targets = (process.env.CALLMEBOT_TARGETS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (targets.length === 0) return

  await Promise.all(targets.map(async (target) => {
    const [phone, apikey] = target.split(':').map((s) => s.trim())
    if (!phone || !apikey) return
    // CallMeBot expects the phone without the leading "+".
    const cleanPhone = phone.replace(/^\+/, '')
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
    try {
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) {
        console.error('CallMeBot WhatsApp failed', { phone, status: res.status, body: await res.text().catch(() => '') })
      }
    } catch (e) {
      console.error('CallMeBot WhatsApp exception', { phone, error: e })
    }
  }))
}

function displayOrderNumber(raw: string) {
  const cleaned = raw.trim()
  if (cleaned.startsWith('DR-')) return `#${cleaned.slice(3, 11)}`
  return `#${cleaned}`
}

// Two supported request shapes:
//
//   1. { orderId }                               ← preferred: server loads the
//      order + items + address itself. Used by the payment callback and the
//      MyFatoorah webhook. Immune to missing/empty client fields.
//
//   2. { orderId, orderNumber, guestEmail, firstName, ..., items: [...] }
//      ← legacy: full payload from checkout page for COD orders. Still
//      accepted so existing callers keep working.
const ByIdSchema = z.object({
  orderId: z.string().min(1),
})

const ItemSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})

const FullPayloadSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  guestEmail: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().default(''),
  phone: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  area: z.string().default(''),
  notes: z.string().optional().default(''),
  shippingZone: z.string().default('qatar'),
  shipping: z.number().nonnegative(),
  paymentMethod: z.enum(['cod', 'card']).default('cod'),
  total: z.number().nonnegative(),
  items: z.array(ItemSchema).min(1),
})

type NormalizedItem = { name: string; nameAr?: string | null; weight?: string | null; quantity: number; price: number }

type NormalizedOrder = {
  orderId: string
  orderNumber: string
  guestEmail: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  area: string
  notes: string
  shippingZone: string
  shipping: number
  paymentMethod: 'cod' | 'card'
  total: number
  items: NormalizedItem[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function itemRows(items: NormalizedItem[]) {
  return items.map((item) => {
    const label = item.nameAr || item.name
    const variant = item.weight ? ` — ${item.weight}` : ''
    const lineTotal = (item.price * item.quantity).toFixed(2)
    return `<tr><td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(label)}${escapeHtml(variant)}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${lineTotal} QAR</td></tr>`
  }).join('')
}

async function loadOrderById(orderId: string): Promise<NormalizedOrder | null> {
  const supabase = getSupabaseAdmin()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, guest_email, total, shipping_cost, shipping_address, mf_invoice_id')
    .eq('id', orderId)
    .maybeSingle()
  if (error || !order) return null

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, variant_name, quantity, unit_price')
    .eq('order_id', orderId)

  const address = (order.shipping_address ?? {}) as Record<string, string>
  const normalized: NormalizedOrder = {
    orderId: order.id as string,
    orderNumber: (order.order_number as string) ?? '',
    guestEmail: (order.guest_email as string) ?? '',
    firstName: address.first_name ?? 'Customer',
    lastName: address.last_name ?? '',
    phone: address.phone ?? '',
    address: address.address ?? '',
    city: address.city ?? '',
    area: address.area ?? '',
    notes: address.notes ?? '',
    shippingZone: address.shipping_zone ?? 'qatar',
    shipping: Number(order.shipping_cost ?? 0),
    paymentMethod: order.mf_invoice_id ? 'card' : 'cod',
    total: Number(order.total ?? 0),
    items: (items ?? []).map((i) => ({
      name: (i.product_name as string) ?? 'Product',
      nameAr: null,
      weight: (i.variant_name as string) ?? null,
      quantity: Number(i.quantity ?? 1),
      price: Number(i.unit_price ?? 0),
    })),
  }
  return normalized
}

// Atomically claim the send. Returns true when this request wins the race
// (email_notified_at was NULL, now set to now()). Returns false when another
// request already claimed it — caller should short-circuit without sending.
async function claimNotification(orderId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('orders')
    .update({ email_notified_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('email_notified_at', null)
    .select('id')
    .maybeSingle()
  return Boolean(data)
}

async function releaseClaim(orderId: string) {
  // The send failed — release the claim so a retry (or the other handler)
  // can try again.
  const supabase = getSupabaseAdmin()
  await supabase.from('orders').update({ email_notified_at: null }).eq('id', orderId)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const ownerEmail = process.env.STORE_OWNER_EMAIL
  if (!apiKey || !from || !ownerEmail) {
    return Response.json({ error: 'Email service is not configured' }, { status: 503 })
  }

  // Prefer the { orderId } shape — load fresh data from DB. Fall back to the
  // legacy full payload from the checkout page.
  let order: NormalizedOrder | null = null
  const byId = ByIdSchema.safeParse(body)
  const looksLikeIdOnly = byId.success && Object.keys(body as Record<string, unknown>).length === 1

  if (looksLikeIdOnly) {
    order = await loadOrderById(byId.data.orderId)
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  } else {
    const parsed = FullPayloadSchema.safeParse(body)
    if (!parsed.success) {
      console.error('Notification payload rejected', parsed.error.flatten())
      return Response.json({ error: 'Invalid order notification payload' }, { status: 400 })
    }
    order = parsed.data
  }

  // Dedup: only one handler actually sends. If another already claimed it, exit.
  const claimed = await claimNotification(order.orderId)
  if (!claimed) {
    return Response.json({ ok: true, skipped: 'already-notified' })
  }

  const resend = new Resend(apiKey)
  const customerName = `${order.firstName} ${order.lastName}`.trim() || 'Customer'
  const rows = itemRows(order.items)
  const shortOrderNo = displayOrderNumber(order.orderNumber)
  const details = `
    <h2>New order ${escapeHtml(shortOrderNo)}</h2>
    <p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(order.guestEmail)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
    <p><strong>Delivery:</strong> ${escapeHtml(order.area)}, ${escapeHtml(order.city)}<br>${escapeHtml(order.address)}</p>
    <p><strong>Shipping zone:</strong> ${escapeHtml(order.shippingZone)}<br><strong>Shipping:</strong> ${order.shipping.toFixed(2)} QAR</p>
    <p><strong>Payment method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</p>
    <p><strong>Delivery time:</strong> ${DELIVERY_WINDOW_EN}</p>
    ${order.notes ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ''}
    <table style="border-collapse:collapse;width:100%;margin-top:20px"><thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #222">Product</th><th style="padding:10px;border-bottom:2px solid #222">Qty</th><th style="padding:10px;text-align:right;border-bottom:2px solid #222">Total</th></tr></thead><tbody>${rows}</tbody></table>
    <p style="font-size:18px"><strong>Order total: ${order.total.toFixed(2)} QAR</strong></p>
  `

  const ownerEmailResult = await resend.emails.send({
    from,
    to: [ownerEmail],
    subject: `New order ${shortOrderNo} — ${order.total.toFixed(2)} QAR`,
    html: details,
  })

  if (ownerEmailResult.error) {
    console.error('Failed to send owner order email', ownerEmailResult.error)
    await releaseClaim(order.orderId)
    return Response.json({ error: 'Could not send order notification' }, { status: 502 })
  }

  const customerEmailResult = await resend.emails.send({
    from,
    to: [order.guestEmail],
    subject: `Order confirmed ${shortOrderNo} — Doha Roastery`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;color:#1a1a1a"><h2>تم تأكيد طلبك</h2><p>شكرًا لك ${escapeHtml(customerName)}. تم استلام طلبك رقم <strong>${escapeHtml(shortOrderNo)}</strong> وسيتم تجهيزه للتوصيل.</p><p><strong>العنوان:</strong> ${escapeHtml(order.area)}، ${escapeHtml(order.city)}<br>${escapeHtml(order.address)}</p><p><strong>الهاتف:</strong> ${escapeHtml(order.phone)}<br><strong>منطقة التوصيل:</strong> ${escapeHtml(order.shippingZone)}<br><strong>الشحن:</strong> ${order.shipping.toFixed(2)} ر.ق<br><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'الدفع بالبطاقة'}<br><strong>مدة التوصيل:</strong> ${DELIVERY_WINDOW_AR}</p><table style="border-collapse:collapse;width:100%;margin-top:20px"><thead><tr><th style="padding:10px;text-align:right;border-bottom:2px solid #222">المنتج</th><th style="padding:10px;border-bottom:2px solid #222">الكمية</th><th style="padding:10px;text-align:left;border-bottom:2px solid #222">الإجمالي</th></tr></thead><tbody>${rows}</tbody></table><p>الإجمالي: <strong>${order.total.toFixed(2)} ر.ق</strong></p><hr><div dir="ltr"><p>Your order <strong>${escapeHtml(shortOrderNo)}</strong> has been confirmed.</p><p>Delivery address: ${escapeHtml(order.address)}, ${escapeHtml(order.area)}, ${escapeHtml(order.city)}</p><p>Delivery time: <strong>${DELIVERY_WINDOW_EN}</strong></p><p>Total: <strong>${order.total.toFixed(2)} QAR</strong>.</p></div></div>`,
  })

  if (customerEmailResult.error) {
    // Owner already got the email — we won't release the claim just because
    // the customer copy failed. Log for admin visibility.
    console.error('Failed to send customer order email', customerEmailResult.error)
  }

  // WhatsApp notification to owner phone(s). Sent once per order thanks to
  // the same email_notified_at dedup — CallMeBot rate-limits at ~1 msg/min
  // so we make it a short summary, not a full receipt.
  const waLines = [
    `🛍️ Order ${shortOrderNo}`,
    `👤 ${customerName}`,
    order.phone ? `📞 ${order.phone}` : null,
    `📍 ${[order.area, order.city].filter(Boolean).join(', ') || '—'}`,
    `💳 ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card (paid)'}`,
    `💰 ${order.total.toFixed(2)} QAR`,
  ].filter(Boolean).join('\n')
  await notifyWhatsApp(waLines)

  return Response.json({
    ok: true,
    orderId: order.orderId,
    ownerEmailSent: true,
    customerEmailSent: !customerEmailResult.error,
  })
}
