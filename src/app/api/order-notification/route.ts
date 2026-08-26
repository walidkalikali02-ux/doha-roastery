import { Resend } from 'resend'
import { z } from 'zod'
import { DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN } from '@/lib/display-text'

function displayOrderNumber(raw: string) {
  const cleaned = raw.trim()
  if (cleaned.startsWith('DR-')) return `#${cleaned.slice(3, 11)}`
  return `#${cleaned}`
}

const ItemSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})

const OrderNotificationSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  guestEmail: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  area: z.string().min(1),
  notes: z.string().optional().default(''),
  shippingZone: z.string().min(1),
  shipping: z.number().nonnegative(),
  paymentMethod: z.enum(['cod', 'card']).default('cod'),
  total: z.number().nonnegative(),
  items: z.array(ItemSchema).min(1),
})

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function itemRows(items: z.infer<typeof ItemSchema>[]) {
  return items.map((item) => {
    const label = item.nameAr || item.name
    const variant = item.weight ? ` — ${item.weight}` : ''
    const lineTotal = (item.price * item.quantity).toFixed(2)
    return `<tr><td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(label)}${escapeHtml(variant)}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${lineTotal} QAR</td></tr>`
  }).join('')
}

export async function POST(request: Request) {
  const parsed = OrderNotificationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid order notification payload' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const ownerEmail = process.env.STORE_OWNER_EMAIL
  if (!apiKey || !from || !ownerEmail) {
    return Response.json({ error: 'Email service is not configured' }, { status: 503 })
  }

  const order = parsed.data
  const resend = new Resend(apiKey)
  const customerName = `${order.firstName} ${order.lastName}`
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
    return Response.json({ error: 'Could not send order notification' }, { status: 502 })
  }

  const customerEmailResult = await resend.emails.send({
    from,
    to: [order.guestEmail],
    subject: `Order confirmed ${shortOrderNo} — Doha Roastery`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;color:#1a1a1a"><h2>تم تأكيد طلبك</h2><p>شكرًا لك ${escapeHtml(customerName)}. تم استلام طلبك رقم <strong>${escapeHtml(shortOrderNo)}</strong> وسيتم تجهيزه للتوصيل.</p><p><strong>العنوان:</strong> ${escapeHtml(order.area)}، ${escapeHtml(order.city)}<br>${escapeHtml(order.address)}</p><p><strong>الهاتف:</strong> ${escapeHtml(order.phone)}<br><strong>منطقة التوصيل:</strong> ${escapeHtml(order.shippingZone)}<br><strong>الشحن:</strong> ${order.shipping.toFixed(2)} ر.ق<br><strong>طريقة الدفع:</strong> ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'الدفع بالبطاقة'}<br><strong>مدة التوصيل:</strong> ${DELIVERY_WINDOW_AR}</p><table style="border-collapse:collapse;width:100%;margin-top:20px"><thead><tr><th style="padding:10px;text-align:right;border-bottom:2px solid #222">المنتج</th><th style="padding:10px;border-bottom:2px solid #222">الكمية</th><th style="padding:10px;text-align:left;border-bottom:2px solid #222">الإجمالي</th></tr></thead><tbody>${rows}</tbody></table><p>الإجمالي: <strong>${order.total.toFixed(2)} ر.ق</strong></p><hr><div dir="ltr"><p>Your order <strong>${escapeHtml(shortOrderNo)}</strong> has been confirmed.</p><p>Delivery address: ${escapeHtml(order.address)}, ${escapeHtml(order.area)}, ${escapeHtml(order.city)}</p><p>Delivery time: <strong>${DELIVERY_WINDOW_EN}</strong></p><p>Total: <strong>${order.total.toFixed(2)} QAR</strong>.</p></div></div>`,
  })

  if (customerEmailResult.error) {
    console.error('Failed to send customer order email', customerEmailResult.error)
  }

  return Response.json({
    ok: true,
    orderId: order.orderId,
    ownerEmailSent: true,
    customerEmailSent: !customerEmailResult.error,
  })
}
