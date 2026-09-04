import { Resend } from 'resend'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN, formatOrderNumber } from '@/lib/display-text'

// ─── Types ───────────────────────────────────────────────────────────────────

type OrderItem = {
  product_name: string
  variant_name: string | null
  quantity: number
  unit_price: number
  total_price: number
}

type OrderRow = {
  id: string
  order_number: string
  guest_email: string
  status: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  total: number
  shipping_address: Record<string, string>
  mf_invoice_id: string | null
  mf_payment_id: string | null
  created_at: string
}

type EmailResult = {
  customerEmailSent: boolean
  adminEmailSent: boolean
  customerEmailError?: string
  adminEmailError?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function money(n: number) {
  return n.toFixed(2)
}

function paymentMethodLabel(method: string) {
  return method === 'cod' ? 'Cash on Delivery' : 'Card Payment'
}

function paymentMethodLabelAr(method: string) {
  return method === 'cod' ? 'الدفع عند الاستلام' : 'الدفع بالبطاقة'
}

function paymentStatusLabel(status: string) {
  if (status === 'paid') return 'Paid'
  if (status === 'payment_failed') return 'Failed'
  return 'Pending'
}

function paymentStatusLabelAr(status: string) {
  if (status === 'paid') return 'مدفوع'
  if (status === 'payment_failed') return 'فشل الدفع'
  return 'قيد الانتظار'
}

// ─── Load Order ──────────────────────────────────────────────────────────────

async function loadOrder(orderId: string): Promise<{
  order: OrderRow
  items: OrderItem[]
} | null> {
  const supabase = getSupabaseAdmin()

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select(
      'id, order_number, guest_email, status, subtotal, discount_amount, shipping_cost, total, shipping_address, mf_invoice_id, mf_payment_id, created_at',
    )
    .eq('id', orderId)
    .maybeSingle()

  if (orderErr || !order) return null

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, variant_name, quantity, unit_price, total_price')
    .eq('order_id', orderId)

  return { order: order as OrderRow, items: (items ?? []) as OrderItem[] }
}

// ─── Atomic Claims ───────────────────────────────────────────────────────────
// Each email recipient is claimed independently via an atomic RPC.
// Only the first caller gets `true`; all others get `false`.

async function claimCustomerEmail(orderId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.rpc('claim_customer_email', { p_order_id: orderId })
  return Boolean(data)
}

async function claimAdminEmail(orderId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.rpc('claim_admin_email', { p_order_id: orderId })
  return Boolean(data)
}

async function releaseCustomerEmail(orderId: string) {
  const supabase = getSupabaseAdmin()
  await supabase.rpc('release_customer_email', { p_order_id: orderId })
}

async function releaseAdminEmail(orderId: string) {
  const supabase = getSupabaseAdmin()
  await supabase.rpc('release_admin_email', { p_order_id: orderId })
}

// ─── Item Rows (shared HTML fragment) ────────────────────────────────────────

function buildItemRowsHtml(items: OrderItem[], dir: 'ltr' | 'rtl') {
  return items
    .map((item) => {
      const variant = item.variant_name ? ` — ${escapeHtml(item.variant_name)}` : ''
      const lineTotal = money(item.unit_price * item.quantity)
      if (dir === 'rtl') {
        return `<tr><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(item.product_name)}${variant}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:left">${lineTotal} ر.ق</td></tr>`
      }
      return `<tr><td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.product_name)}${variant}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${lineTotal} QAR</td></tr>`
    })
    .join('')
}

// ─── Customer Email HTML ─────────────────────────────────────────────────────

function buildCustomerEmailHtml(opts: {
  customerName: string
  orderNumber: string
  address: string
  area: string
  city: string
  phone: string
  shippingZone: string
  shippingCost: number
  paymentMethod: string
  paymentStatus: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  hasMfPayment: boolean
}) {
  const {
    customerName, orderNumber, address, area, city, phone,
    shippingZone, shippingCost, paymentMethod, paymentStatus,
    items, subtotal, discount, total, hasMfPayment,
  } = opts

  const rows = buildItemRowsHtml(items, 'rtl')
  const rowsEn = buildItemRowsHtml(items, 'ltr')
  const paymentLine = hasMfPayment ? `MyFatoorah Payment ID: ${escapeHtml(opts.hasMfPayment ? 'Yes' : 'No')}` : ''

  return `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto">
  <!-- Arabic Section -->
  <div dir="rtl" style="padding:20px">
    <h2 style="color:#1a1a1a;margin-bottom:8px">تم تأكيد طلبك</h2>
    <p>شكرًا لك <strong>${escapeHtml(customerName)}</strong>. تم استلام طلبك رقم <strong>#${escapeHtml(orderNumber)}</strong> وسيتم تجهيزه للتوصيل.</p>

    <table style="border-collapse:collapse;width:100%;margin:16px 0"><thead><tr><th style="padding:10px;text-align:right;border-bottom:2px solid #222">المنتج</th><th style="padding:10px;border-bottom:2px solid #222">الكمية</th><th style="padding:10px;text-align:left;border-bottom:2px solid #222">السعر</th></tr></thead><tbody>${rows}</tbody></table>

    <p><strong>المجموع الفرعي:</strong> ${money(subtotal)} ر.ق</p>
    ${discount > 0 ? `<p><strong>الخصم:</strong> -${money(discount)} ر.ق</p>` : ''}
    <p><strong>رسوم التوصيل:</strong> ${money(shippingCost)} ر.ق</p>
    <p style="font-size:18px"><strong>الإجمالي: ${money(total)} ر.ق</strong></p>

    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">

    <p><strong>العنوان:</strong> ${escapeHtml(area)}، ${escapeHtml(city)}<br>${escapeHtml(address)}</p>
    <p><strong>الهاتف:</strong> ${escapeHtml(phone)}</p>
    <p><strong>منطقة التوصيل:</strong> ${escapeHtml(shippingZone)}</p>
    <p><strong>طريقة الدفع:</strong> ${escapeHtml(paymentMethodLabelAr(paymentMethod))}</p>
    <p><strong>حالة الدفع:</strong> ${escapeHtml(paymentStatusLabelAr(paymentStatus))}</p>
    <p><strong>مدة التوصيل:</strong> ${DELIVERY_WINDOW_AR}</p>
  </div>

  <hr style="border:none;border-top:2px solid #eee;margin:0 20px">

  <!-- English Section -->
  <div dir="ltr" style="padding:20px">
    <h2 style="color:#1a1a1a;margin-bottom:8px">Order Confirmed</h2>
    <p>Hi <strong>${escapeHtml(customerName)}</strong>, your order <strong>#${escapeHtml(orderNumber)}</strong> has been confirmed and is being prepared for delivery.</p>

    <table style="border-collapse:collapse;width:100%;margin:16px 0"><thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #222">Product</th><th style="padding:10px;border-bottom:2px solid #222">Qty</th><th style="padding:10px;text-align:right;border-bottom:2px solid #222">Price</th></tr></thead><tbody>${rowsEn}</tbody></table>

    <p><strong>Subtotal:</strong> ${money(subtotal)} QAR</p>
    ${discount > 0 ? `<p><strong>Discount:</strong> -${money(discount)} QAR</p>` : ''}
    <p><strong>Delivery Fee:</strong> ${money(shippingCost)} QAR</p>
    <p style="font-size:18px"><strong>Grand Total: ${money(total)} QAR</strong></p>

    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">

    <p><strong>Delivery Address:</strong><br>${escapeHtml(address)}<br>${escapeHtml(area)}, ${escapeHtml(city)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Shipping Zone:</strong> ${escapeHtml(shippingZone)}</p>
    <p><strong>Payment Method:</strong> ${escapeHtml(paymentMethodLabel(paymentMethod))}</p>
    <p><strong>Payment Status:</strong> ${escapeHtml(paymentStatusLabel(paymentStatus))}</p>
    <p><strong>Delivery Time:</strong> ${DELIVERY_WINDOW_EN}</p>
    ${paymentLine ? `<p>${paymentLine}</p>` : ''}

    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#888;text-align:center">Thank you for choosing Doha Roastery. We roast fresh for you.</p>
  </div>
</div>`
}

// ─── Admin Email HTML ────────────────────────────────────────────────────────

function buildAdminEmailHtml(opts: {
  orderNumber: string
  createdAt: string
  customerName: string
  customerEmail: string
  phone: string
  fullAddress: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  paymentMethod: string
  paymentStatus: string
  mfPaymentId: string | null
  mfInvoiceId: string | null
  notes: string
}) {
  const {
    orderNumber, createdAt, customerName, customerEmail, phone,
    fullAddress, items, subtotal, discount, shippingCost, total,
    paymentMethod, paymentStatus, mfPaymentId, mfInvoiceId, notes,
  } = opts

  const rows = items
    .map((item) => {
      const variant = item.variant_name ? ` (${escapeHtml(item.variant_name)})` : ''
      return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.product_name)}${variant}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.unit_price)} QAR</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.total_price)} QAR</td></tr>`
    })
    .join('')

  const paymentRef = mfPaymentId
    ? `<p><strong>MyFatoorah Payment ID:</strong> ${escapeHtml(mfPaymentId)}</p>`
    : mfInvoiceId
      ? `<p><strong>MyFatoorah Invoice ID:</strong> ${escapeHtml(mfInvoiceId)}</p>`
      : ''

  return `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:650px;margin:0 auto;padding:20px">
  <h2 style="color:#1a1a1a;border-bottom:2px solid #222;padding-bottom:8px">New Order #${escapeHtml(orderNumber)}</h2>

  <p><strong>Order Time:</strong> ${escapeHtml(createdAt)}</p>

  <h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Customer Information</h3>
  <p><strong>Name:</strong> ${escapeHtml(customerName)}</p>
  <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
  <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
  <p><strong>Delivery Address:</strong><br>${escapeHtml(fullAddress)}</p>

  <h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Order Items</h3>
  <table style="border-collapse:collapse;width:100%"><thead><tr><th style="padding:8px;text-align:left;border-bottom:2px solid #222">Product</th><th style="padding:8px;border-bottom:2px solid #222">Qty</th><th style="padding:8px;text-align:right;border-bottom:2px solid #222">Unit Price</th><th style="padding:8px;text-align:right;border-bottom:2px solid #222">Total</th></tr></thead><tbody>${rows}</tbody></table>

  <div style="margin-top:16px">
    <p><strong>Subtotal:</strong> ${money(subtotal)} QAR</p>
    ${discount > 0 ? `<p><strong>Discount:</strong> -${money(discount)} QAR</p>` : ''}
    <p><strong>Delivery Fee:</strong> ${money(shippingCost)} QAR</p>
    <p style="font-size:18px"><strong>Grand Total: ${money(total)} QAR</strong></p>
  </div>

  <h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Payment</h3>
  <p><strong>Method:</strong> ${escapeHtml(paymentMethodLabel(paymentMethod))}</p>
  <p><strong>Status:</strong> ${escapeHtml(paymentStatusLabel(paymentStatus))}</p>
  ${paymentRef}

  ${notes ? `<h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Notes</h3><p>${escapeHtml(notes)}</p>` : ''}
</div>`
}

// ─── WhatsApp Notification ───────────────────────────────────────────────────

async function notifyWhatsApp(text: string) {
  const targets = (process.env.CALLMEBOT_TARGETS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (targets.length === 0) return

  await Promise.all(
    targets.map(async (target) => {
      const [phone, apikey] = target.split(':').map((s) => s.trim())
      if (!phone || !apikey) return
      const cleanPhone = phone.replace(/^\+/, '')
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`
      try {
        const res = await fetch(url, { method: 'GET' })
        if (!res.ok) {
          console.error('CallMeBot WhatsApp failed', {
            phone,
            status: res.status,
            body: await res.text().catch(() => ''),
          })
        }
      } catch (e) {
        console.error('CallMeBot WhatsApp exception', { phone, error: e })
      }
    }),
  )
}

// ─── Main Function ───────────────────────────────────────────────────────────

export async function sendOrderEmails(orderId: string): Promise<EmailResult> {
  const result: EmailResult = {
    customerEmailSent: false,
    adminEmailSent: false,
  }

  // 1. Load order data
  const loaded = await loadOrder(orderId)
  if (!loaded) {
    console.error('sendOrderEmails: order not found', { orderId })
    return result
  }

  const { order, items } = loaded
  const address = (order.shipping_address ?? {}) as Record<string, string>
  const firstName = address.first_name ?? 'Customer'
  const lastName = address.last_name ?? ''
  const customerName = `${firstName} ${lastName}`.trim() || 'Customer'
  const phone = address.phone ?? ''
  const streetAddress = address.address ?? ''
  const area = address.area ?? ''
  const city = address.city ?? ''
  const shippingZone = address.shipping_zone ?? 'qatar'
  const paymentMethod = address.payment_method ?? (order.mf_invoice_id ? 'card' : 'cod')
  const notes = address.notes ?? ''
  const shortOrderNo = formatOrderNumber({ order_number: order.order_number, id: order.id })
  const orderNumberDisplay = shortOrderNo.replace('#', '')
  const fullAddress = [streetAddress, area, city].filter(Boolean).join(', ')
  const createdAt = new Date(order.created_at).toLocaleString('en-US', {
    timeZone: 'Asia/Qatar',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const adminEmail = process.env.STORE_OWNER_EMAIL
  if (!apiKey || !from || !adminEmail) {
    console.error('sendOrderEmails: email service not configured')
    return result
  }

  const resend = new Resend(apiKey)

  // 2. Send customer email (atomic claim)
  const customerClaimed = await claimCustomerEmail(orderId)
  if (customerClaimed) {
    try {
      const customerHtml = buildCustomerEmailHtml({
        customerName,
        orderNumber: orderNumberDisplay,
        address: streetAddress,
        area,
        city,
        phone,
        shippingZone,
        shippingCost: order.shipping_cost,
        paymentMethod,
        paymentStatus: order.status,
        items,
        subtotal: order.subtotal,
        discount: order.discount_amount,
        total: order.total,
        hasMfPayment: Boolean(order.mf_payment_id),
      })

      const { error } = await resend.emails.send({
        from,
        to: [order.guest_email],
        subject: `Order confirmed ${shortOrderNo} — Doha Roastery`,
        html: customerHtml,
      })

      if (error) {
        console.error('Customer email failed', { orderId, error })
        await releaseCustomerEmail(orderId)
        result.customerEmailError = error.message ?? 'Unknown error'
      } else {
        result.customerEmailSent = true
      }
    } catch (e) {
      console.error('Customer email exception', { orderId, error: e })
      await releaseCustomerEmail(orderId)
      result.customerEmailError = e instanceof Error ? e.message : 'Exception'
    }
  }

  // 3. Send admin email (atomic claim)
  const adminClaimed = await claimAdminEmail(orderId)
  if (adminClaimed) {
    try {
      const adminHtml = buildAdminEmailHtml({
        orderNumber: orderNumberDisplay,
        createdAt,
        customerName,
        customerEmail: order.guest_email,
        phone,
        fullAddress,
        items,
        subtotal: order.subtotal,
        discount: order.discount_amount,
        shippingCost: order.shipping_cost,
        total: order.total,
        paymentMethod,
        paymentStatus: order.status,
        mfPaymentId: order.mf_payment_id,
        mfInvoiceId: order.mf_invoice_id,
        notes,
      })

      const { error } = await resend.emails.send({
        from,
        to: [adminEmail],
        subject: `New order ${shortOrderNo} — ${money(order.total)} QAR`,
        html: adminHtml,
      })

      if (error) {
        console.error('Admin email failed', { orderId, error })
        await releaseAdminEmail(orderId)
        result.adminEmailError = error.message ?? 'Unknown error'
      } else {
        result.adminEmailSent = true
      }
    } catch (e) {
      console.error('Admin email exception', { orderId, error: e })
      await releaseAdminEmail(orderId)
      result.adminEmailError = e instanceof Error ? e.message : 'Exception'
    }
  }

  // 4. WhatsApp notification (best-effort, no dedup needed — rate-limited by CallMeBot)
  if (customerClaimed && result.customerEmailSent) {
    const waLines = [
      `Order ${shortOrderNo}`,
      customerName,
      phone ? `Phone: ${phone}` : null,
      `Address: ${fullAddress || '—'}`,
      `${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card (paid)'}`,
      `${money(order.total)} QAR`,
    ]
      .filter(Boolean)
      .join('\n')
    await notifyWhatsApp(waLines)
  }

  return result
}
