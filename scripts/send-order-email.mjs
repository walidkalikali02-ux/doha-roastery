#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL
const adminEmail = process.env.STORE_OWNER_EMAIL

if (!url || !serviceRoleKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}
if (!resendKey || !fromEmail || !adminEmail) {
  console.error('Missing email service credentials in environment')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const orderNumber = process.argv[2]
if (!orderNumber) {
  console.error('Usage: node scripts/send-order-email.mjs <order_number>')
  process.exit(1)
}

console.log(`Looking up order #${orderNumber}...`)

const { data: order, error: orderErr } = await supabase
  .from('orders')
  .select('id, order_number, guest_email, status, subtotal, discount_amount, shipping_cost, total, shipping_address, mf_invoice_id, mf_payment_id, created_at, customer_email_notified_at, admin_email_notified_at')
  .eq('order_number', orderNumber)
  .maybeSingle()

if (orderErr) {
  console.error('Error fetching order:', orderErr.message)
  process.exit(1)
}
if (!order) {
  console.error(`Order #${orderNumber} not found`)
  process.exit(1)
}

console.log(`Found order ${order.id}`)
console.log(`  Status: ${order.status}`)
console.log(`  Email: ${order.guest_email}`)
console.log(`  Total: ${order.total} QAR`)
console.log(`  Customer email notified: ${order.customer_email_notified_at ?? 'no'}`)
console.log(`  Admin email notified: ${order.admin_email_notified_at ?? 'no'}`)

const { data: items } = await supabase
  .from('order_items')
  .select('product_name, variant_name, quantity, unit_price, total_price')
  .eq('order_id', order.id)

console.log(`  Items: ${items?.length ?? 0}`)

// Build addresses
const addr = order.shipping_address || {}
const customerName = [addr.first_name, addr.last_name].filter(Boolean).join(' ') || 'Customer'
const phone = addr.phone || ''
const streetAddress = addr.address || ''
const area = addr.area || ''
const city = addr.city || ''
const shippingZone = addr.shipping_zone || 'qatar'
const paymentMethod = addr.payment_method || (order.mf_invoice_id ? 'card' : 'cod')
const notes = addr.notes || ''
const fullAddress = [streetAddress, area, city].filter(Boolean).join(', ')

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function money(n) {
  return Number(n).toFixed(2)
}

function paymentMethodLabel(method) {
  return method === 'cod' ? 'Cash on Delivery' : 'Card Payment'
}
function paymentMethodLabelAr(method) {
  return method === 'cod' ? 'الدفع عند الاستلام' : 'الدفع بالبطاقة'
}
function paymentStatusLabel(status) {
  if (status === 'paid') return 'Paid'
  if (status === 'payment_failed') return 'Failed'
  return 'Pending'
}
function paymentStatusLabelAr(status) {
  if (status === 'paid') return 'مدفوع'
  if (status === 'payment_failed') return 'فشل الدفع'
  return 'قيد الانتظار'
}

const DELIVERY_WINDOW_AR = 'خلال ١–٢ يوم'
const DELIVERY_WINDOW_EN = '1–2 days'

function formatOrderNumber(ord) {
  const raw = (ord.order_number || '').trim()
  if (!raw) return `#${ord.id.slice(0, 8)}`
  const cleaned = raw.startsWith('DR-') ? raw.slice(3, 11) : raw
  return `#${cleaned}`
}

const shortOrderNo = formatOrderNumber(order)

function buildItemRowsHtml(items, dir) {
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

const rows = buildItemRowsHtml(items || [], 'rtl')
const rowsEn = buildItemRowsHtml(items || [], 'ltr')

const customerHtml = `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto">
  <div dir="rtl" style="padding:20px">
    <h2 style="color:#1a1a1a;margin-bottom:8px">تم تأكيد طلبك</h2>
    <p>شكرًا لك <strong>${escapeHtml(customerName)}</strong>. تم استلام طلبك رقم <strong>#${escapeHtml(orderNumber)}</strong> وسيتم تجهيزه للتوصيل.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0"><thead><tr><th style="padding:10px;text-align:right;border-bottom:2px solid #222">المنتج</th><th style="padding:10px;border-bottom:2px solid #222">الكمية</th><th style="padding:10px;text-align:left;border-bottom:2px solid #222">السعر</th></tr></thead><tbody>${rows}</tbody></table>
    <p><strong>المجموع الفرعي:</strong> ${money(order.subtotal)} ر.ق</p>
    ${order.discount_amount > 0 ? `<p><strong>الخصم:</strong> -${money(order.discount_amount)} ر.ق</p>` : ''}
    <p><strong>رسوم التوصيل:</strong> ${money(order.shipping_cost)} ر.ق</p>
    <p style="font-size:18px"><strong>الإجمالي: ${money(order.total)} ر.ق</strong></p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p><strong>العنوان:</strong> ${escapeHtml(area)}، ${escapeHtml(city)}<br>${escapeHtml(streetAddress)}</p>
    <p><strong>الهاتف:</strong> ${escapeHtml(phone)}</p>
    <p><strong>منطقة التوصيل:</strong> ${escapeHtml(shippingZone)}</p>
    <p><strong>طريقة الدفع:</strong> ${escapeHtml(paymentMethodLabelAr(paymentMethod))}</p>
    <p><strong>حالة الدفع:</strong> ${escapeHtml(paymentStatusLabelAr(order.status))}</p>
    <p><strong>مدة التوصيل:</strong> ${DELIVERY_WINDOW_AR}</p>
  </div>
  <hr style="border:none;border-top:2px solid #eee;margin:0 20px">
  <div dir="ltr" style="padding:20px">
    <h2 style="color:#1a1a1a;margin-bottom:8px">Order Confirmed</h2>
    <p>Hi <strong>${escapeHtml(customerName)}</strong>, your order <strong>#${escapeHtml(orderNumber)}</strong> has been confirmed and is being prepared for delivery.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0"><thead><tr><th style="padding:10px;text-align:left;border-bottom:2px solid #222">Product</th><th style="padding:10px;border-bottom:2px solid #222">Qty</th><th style="padding:10px;text-align:right;border-bottom:2px solid #222">Price</th></tr></thead><tbody>${rowsEn}</tbody></table>
    <p><strong>Subtotal:</strong> ${money(order.subtotal)} QAR</p>
    ${order.discount_amount > 0 ? `<p><strong>Discount:</strong> -${money(order.discount_amount)} QAR</p>` : ''}
    <p><strong>Delivery Fee:</strong> ${money(order.shipping_cost)} QAR</p>
    <p style="font-size:18px"><strong>Grand Total: ${money(order.total)} QAR</strong></p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p><strong>Delivery Address:</strong><br>${escapeHtml(streetAddress)}<br>${escapeHtml(area)}, ${escapeHtml(city)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Shipping Zone:</strong> ${escapeHtml(shippingZone)}</p>
    <p><strong>Payment Method:</strong> ${escapeHtml(paymentMethodLabel(paymentMethod))}</p>
    <p><strong>Payment Status:</strong> ${escapeHtml(paymentStatusLabel(order.status))}</p>
    <p><strong>Delivery Time:</strong> ${DELIVERY_WINDOW_EN}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:12px;color:#888;text-align:center">Thank you for choosing Doha Roastery. We roast fresh for you.</p>
  </div>
</div>`

const createdAt = new Date(order.created_at).toLocaleString('en-US', {
  timeZone: 'Asia/Qatar',
  year: 'numeric', month: 'short', day: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

const adminRows = (items || [])
  .map((item) => {
    const variant = item.variant_name ? ` (${escapeHtml(item.variant_name)})` : ''
    return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.product_name)}${variant}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.unit_price)} QAR</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(item.total_price)} QAR</td></tr>`
  })
  .join('')

const paymentRef = order.mf_payment_id
  ? `<p><strong>MyFatoorah Payment ID:</strong> ${escapeHtml(order.mf_payment_id)}</p>`
  : order.mf_invoice_id
    ? `<p><strong>MyFatoorah Invoice ID:</strong> ${escapeHtml(order.mf_invoice_id)}</p>`
    : ''

const adminHtml = `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:650px;margin:0 auto;padding:20px">
  <h2 style="color:#1a1a1a;border-bottom:2px solid #222;padding-bottom:8px">New Order #${escapeHtml(orderNumber)}</h2>
  <p><strong>Order Time:</strong> ${escapeHtml(createdAt)}</p>
  <h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Customer Information</h3>
  <p><strong>Name:</strong> ${escapeHtml(customerName)}</p>
  <p><strong>Email:</strong> ${escapeHtml(order.guest_email)}</p>
  <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
  <p><strong>Delivery Address:</strong><br>${escapeHtml(fullAddress)}</p>
  <h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Order Items</h3>
  <table style="border-collapse:collapse;width:100%"><thead><tr><th style="padding:8px;text-align:left;border-bottom:2px solid #222">Product</th><th style="padding:8px;border-bottom:2px solid #222">Qty</th><th style="padding:8px;text-align:right;border-bottom:2px solid #222">Unit Price</th><th style="padding:8px;text-align:right;border-bottom:2px solid #222">Total</th></tr></thead><tbody>${adminRows}</tbody></table>
  <div style="margin-top:16px">
    <p><strong>Subtotal:</strong> ${money(order.subtotal)} QAR</p>
    ${order.discount_amount > 0 ? `<p><strong>Discount:</strong> -${money(order.discount_amount)} QAR</p>` : ''}
    <p><strong>Delivery Fee:</strong> ${money(order.shipping_cost)} QAR</p>
    <p style="font-size:18px"><strong>Grand Total: ${money(order.total)} QAR</strong></p>
  </div>
  <h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Payment</h3>
  <p><strong>Method:</strong> ${escapeHtml(paymentMethodLabel(paymentMethod))}</p>
  <p><strong>Status:</strong> ${escapeHtml(paymentStatusLabel(order.status))}</p>
  ${paymentRef}
  ${notes ? `<h3 style="margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px">Notes</h3><p>${escapeHtml(notes)}</p>` : ''}
</div>`

const resend = new Resend(resendKey)

// Force-send: bypass claims by directly sending
console.log('\nSending customer email...')
const customerResult = await resend.emails.send({
  from: fromEmail,
  to: [order.guest_email],
  subject: `Order confirmed ${shortOrderNo} — Doha Roastery`,
  html: customerHtml,
})
if (customerResult.error) {
  console.error('Customer email FAILED:', customerResult.error.message)
} else {
  console.log('Customer email SENT to:', order.guest_email)
}

console.log('Sending admin email...')
const adminResult = await resend.emails.send({
  from: fromEmail,
  to: [adminEmail],
  subject: `New order ${shortOrderNo} — ${money(order.total)} QAR`,
  html: adminHtml,
})
if (adminResult.error) {
  console.error('Admin email FAILED:', adminResult.error.message)
} else {
  console.log('Admin email SENT to:', adminEmail)
}

// Update notification timestamps
await supabase
  .from('orders')
  .update({
    customer_email_notified_at: new Date().toISOString(),
    admin_email_notified_at: new Date().toISOString(),
  })
  .eq('id', order.id)

console.log('\nDone.')
