'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Lock } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN, localizeWeight } from '@/lib/display-text'
import { getShippingCost, SHIPPING_RATES, ShippingZone, shippingZoneLabel } from '@/lib/shipping'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type Step = 'info' | 'shipping' | 'review'
type PaymentMethod = 'cod' | 'card'

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  area: string
  notes: string
}

const EMPTY: FormData = {
  email: '', firstName: '', lastName: '', phone: '',
  address: '', city: '', area: '', notes: '',
}

function CheckoutInner() {
  const { t, dir, lang } = useLang()
  const { items, total, clear } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const retryOrderId = searchParams.get('retry')

  const [step, setStep] = useState<Step>('info')
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingZone, setShippingZone] = useState<ShippingZone | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState<string | null>(null)
  const contactEmail = user?.email ?? form.email

  const shipping = getShippingCost(shippingZone) ?? 0
  const grandTotal = total + shipping
  const cashOnDeliveryAvailable = shippingZone === 'doha' || shippingZone === 'qatar'

  function f(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value })
  }

  async function startPayment(orderId: string) {
    const paymentResponse = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, language: lang }),
    })
    const payment = await paymentResponse.json().catch(() => null) as { paymentUrl?: string; error?: string } | null
    if (!paymentResponse.ok || !payment?.paymentUrl) {
      throw new Error(payment?.error ?? t('تعذر بدء عملية الدفع', 'Could not start payment'))
    }

    clear()
    window.location.assign(payment.paymentUrl)
  }

  async function placeOrder() {
    if (!shippingZone) {
      setError(t('يرجى اختيار منطقة التوصيل', 'Please choose a delivery area'))
      setStep('shipping')
      return
    }
    if (paymentMethod === 'cod' && !cashOnDeliveryAvailable) {
      setPaymentMethod('card')
      setError(t('الدفع عند الاستلام متاح للطلبات داخل قطر فقط', 'Cash on delivery is available for orders within Qatar only'))
      return
    }
    setSubmitting(true)
    setError(null)
    const orderEmail = user?.email ?? form.email
    try {
      // Server-side RPC recomputes subtotal/shipping/total from ecommerce_products
      // and generates the order_number. Client-supplied prices are ignored.
      const { data, error: rpcErr } = await supabase.rpc('place_order', {
        p_guest_email: orderEmail,
        p_shipping_address: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          area: form.area,
          notes: form.notes,
          shipping_zone: shippingZone,
          payment_method: paymentMethod,
        },
        p_items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          weight: item.weight ?? null,
          grind: item.grind ?? null,
        })),
      })

      if (rpcErr || !data) throw rpcErr ?? new Error(t('تعذر إنشاء الطلب', 'Order creation failed'))

      const { order_id, order_number } = data as { order_id: string; order_number: string }

      if (paymentMethod === 'card') {
        setPendingPaymentOrderId(order_id)
        await startPayment(order_id)
        return
      }

      await fetch('/api/send-order-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order_id }),
      }).catch((emailError) => {
        console.error('Order created but email notification failed', emailError)
      })

      clear()
      router.push(`/checkout/success?order=${encodeURIComponent(order_number)}`)
    } catch (e: unknown) {
      setError((e as Error).message ?? t('حدث خطأ. حاول مجدداً.', 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function retryPayment() {
    const orderId = retryOrderId ?? pendingPaymentOrderId
    if (!orderId) return
    setSubmitting(true)
    setError(null)
    try {
      await startPayment(orderId)
    } catch (e: unknown) {
      setError((e as Error).message ?? t('حدث خطأ. حاول مجدداً.', 'Something went wrong. Please try again.'))
      setSubmitting(false)
    }
  }

  if (retryOrderId) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen bg-cream" dir={dir}>
          <div className="max-w-xl mx-auto px-6 py-20 text-center">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 mb-8 text-sm">
              {t(
                'لم تتم عملية الدفع. تم حفظ طلبك ويمكنك إعادة المحاولة بالضغط أدناه.',
                'Payment was not completed. Your order has been saved and you can retry payment below.'
              )}
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              onClick={retryPayment}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors disabled:opacity-50"
            >
              <Lock size={14} strokeWidth={1.5} />
              {submitting
                ? t('جارٍ التوجيه للدفع...', 'Redirecting to payment...')
                : t('إعادة محاولة الدفع', 'Retry Payment')}
            </button>
            <Link href="/" className="block mt-4 text-xs tracking-widest uppercase text-charcoal/40 hover:text-charcoal transition-colors">
              {t('إلغاء والعودة للرئيسية', 'Cancel and go home')}
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-24 min-h-screen flex items-center justify-center" dir={dir}>
          <div className="text-center">
            <p className="text-charcoal/40 mb-4">{t('السلة فارغة', 'Your cart is empty')}</p>
            <Link href="/products">
              <span className="text-sm tracking-widest uppercase border-b border-charcoal text-charcoal hover:text-sand hover:border-sand transition-colors">
                {t('العودة للتسوق', 'Back to Shop')}
              </span>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'info', label: t('المعلومات', 'Info') },
    { key: 'shipping', label: t('الشحن', 'Shipping') },
    { key: 'review', label: t('المراجعة', 'Review') },
  ]

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-cream" dir={dir}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-charcoal/40 mb-10">
            <Link href="/cart" className="hover:text-sand transition-colors">{t('السلة', 'Cart')}</Link>
            {steps.map((s) => (
              <span key={s.key} className="flex items-center gap-2">
                <ChevronRight size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
                <span className={step === s.key ? 'text-charcoal font-medium' : 'text-charcoal/40'}>
                  {s.label}
                </span>
              </span>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form area */}
            <div className="lg:col-span-3 space-y-8">

              {/* Step 1: Contact info */}
              {step === 'info' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs tracking-[0.4em] uppercase text-sand mb-1">{t('الخطوة 1 من 3', 'Step 1 of 3')}</p>
                    <h2 className="text-2xl font-light text-charcoal">{t('معلومات التواصل', 'Contact Information')}</h2>
                  </div>

                  <div className="grid gap-4">
                    <Field label={t('البريد الإلكتروني *', 'Email *')} type="email" value={contactEmail} onChange={f('email')} required disabled={Boolean(user)} />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t('الاسم الأول *', 'First Name *')} value={form.firstName} onChange={f('firstName')} required />
                      <Field label={t('اسم العائلة *', 'Last Name *')} value={form.lastName} onChange={f('lastName')} required />
                    </div>
                    <Field label={t('رقم الهاتف *', 'Phone *')} type="tel" value={form.phone} onChange={f('phone')} required />
                  </div>

                  <button
                    onClick={() => {
                      if (!contactEmail || !form.firstName || !form.lastName || !form.phone) {
                        setError(t('يرجى تعبئة الحقول المطلوبة', 'Please fill all required fields'))
                        return
                      }
                      setError(null)
                      setStep('shipping')
                    }}
                    className="w-full bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors"
                  >
                    {t('التالي: الشحن', 'Next: Shipping')}
                  </button>
                </div>
              )}

              {/* Step 2: Shipping address */}
              {step === 'shipping' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs tracking-[0.4em] uppercase text-sand mb-1">{t('الخطوة 2 من 3', 'Step 2 of 3')}</p>
                    <h2 className="text-2xl font-light text-charcoal">{t('عنوان التوصيل', 'Delivery Address')}</h2>
                  </div>

                  <div className="grid gap-4">
                    <Field label={t('المنطقة / الحي *', 'Area / District *')} value={form.area} onChange={f('area')} required />
                    <Field label={t('المدينة *', 'City *')} value={form.city} onChange={f('city')} required />
                    <Field label={t('العنوان التفصيلي *', 'Full Address *')} value={form.address} onChange={f('address')} required />
                    <div>
                      <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                        {t('منطقة التوصيل *', 'Delivery Area *')}
                      </label>
                      <select
                        value={shippingZone}
                        onChange={(e) => {
                          const zone = e.target.value as ShippingZone | ''
                          setShippingZone(zone)
                          if (zone === 'gcc') setPaymentMethod('card')
                        }}
                        required
                        className="w-full border border-sand/30 px-4 py-3 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal"
                      >
                        <option value="">{t('اختر منطقة التوصيل', 'Choose delivery area')}</option>
                        {(['doha', 'qatar', 'gcc'] as ShippingZone[]).map((zone) => (
                          <option key={zone} value={zone}>
                            {shippingZoneLabel(zone, lang)} — {SHIPPING_RATES[zone]} {t('ر.ق', 'QAR')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                        {t('ملاحظات إضافية', 'Order Notes')}
                      </label>
                      <textarea
                        rows={3}
                        value={form.notes}
                        onChange={f('notes')}
                        placeholder={t('تعليمات خاصة للتوصيل...', 'Special delivery instructions...')}
                        className="w-full border border-sand/30 px-4 py-3 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal resize-none"
                      />
                    </div>
                  </div>

                  {/* Shipping method */}
                  <div className="border border-sand/20 p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{t('توصيل قياسي', 'Standard Delivery')}</p>
                        <p className="text-xs text-charcoal/50 mt-0.5">{t(DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN)}</p>
                      </div>
                      <p className="text-sm font-medium text-charcoal">
                         {shippingZone ? <><bdi dir="ltr">{shipping}</bdi> {t('ر.ق', 'QAR')}</> : t('اختر المنطقة', 'Choose area')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep('info')} className="flex-1 border border-sand/40 text-charcoal py-3.5 text-sm tracking-widest uppercase hover:border-charcoal transition-colors">
                      {t('← رجوع', '← Back')}
                    </button>
                    <button
                      onClick={() => {
                         if (!form.area || !form.city || !form.address || !shippingZone) {
                          setError(t('يرجى تعبئة الحقول المطلوبة', 'Please fill all required fields'))
                          return
                        }
                        setError(null)
                        setStep('review')
                      }}
                      className="flex-1 bg-charcoal text-cream py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors"
                    >
                      {t('التالي: المراجعة', 'Next: Review')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 'review' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs tracking-[0.4em] uppercase text-sand mb-1">{t('الخطوة 3 من 3', 'Step 3 of 3')}</p>
                    <h2 className="text-2xl font-light text-charcoal">{t('مراجعة الطلب', 'Review Order')}</h2>
                  </div>

                  {/* Contact summary */}
                  <ReviewSection title={t('معلومات التواصل', 'Contact')} onEdit={() => setStep('info')}>
                    <p>{contactEmail}</p>
                    <p>{form.firstName} {form.lastName}</p>
                     <p><bdi dir="ltr">{form.phone}</bdi></p>
                  </ReviewSection>

                  {/* Shipping summary */}
                  <ReviewSection title={t('عنوان التوصيل', 'Delivery Address')} onEdit={() => setStep('shipping')}>
                    <p>{form.address}</p>
                     <p>{form.area}، {form.city}</p>
                     {shippingZone && <p>{shippingZoneLabel(shippingZone, lang)}</p>}
                    {form.notes && <p className="text-charcoal/50 italic">{form.notes}</p>}
                  </ReviewSection>

                   {/* Items summary */}
                   <div className="border border-sand/20 bg-white p-5">
                     <p className="text-xs tracking-widest uppercase text-charcoal/50 mb-3">
                       {t('طريقة الدفع', 'Payment Method')}
                     </p>
                     <div className="grid sm:grid-cols-2 gap-3">
                       {cashOnDeliveryAvailable && (
                         <label className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-charcoal bg-cream/40' : 'border-sand/20'}`}>
                           <input
                             type="radio"
                             name="payment-method"
                             value="cod"
                             checked={paymentMethod === 'cod'}
                             onChange={() => setPaymentMethod('cod')}
                             className="mt-1 accent-charcoal"
                           />
                           <span>
                             <span className="block text-sm text-charcoal">{t('الدفع عند الاستلام', 'Cash on Delivery')}</span>
                             <span className="block text-xs text-charcoal/50 mt-1">{t('ادفع عند وصول طلبك', 'Pay when your order arrives')}</span>
                           </span>
                         </label>
                       )}
                       <label className={`flex items-start gap-3 border p-4 transition-colors ${paymentMethod === 'card' ? 'border-sand bg-cream/40' : 'border-sand/20 opacity-60'}`}>
                         <input
                           type="radio"
                           name="payment-method"
                           value="card"
                           checked={paymentMethod === 'card'}
                           onChange={() => setPaymentMethod('card')}
                           className="mt-1 accent-charcoal"
                         />
                         <span>
                           <span className="block text-sm text-charcoal">{t('الدفع بالبطاقة', 'Card Payment')}</span>
                           <span className="block text-xs text-charcoal/50 mt-1">{t('الدفع الآمن عبر ماي فاتورة', 'Secure payment via MyFatoorah')}</span>
                         </span>
                       </label>
                     </div>
                     {!cashOnDeliveryAvailable && (
                       <p className="mt-3 text-xs text-charcoal/50">
                         {t('الدفع عند الاستلام متاح للطلبات داخل قطر فقط.', 'Cash on delivery is available for orders within Qatar only.')}
                       </p>
                     )}
                   </div>

                   {/* Items summary */}
                   <div className="border border-sand/20 bg-white p-5 space-y-3">
                    {items.map((item) => (
                      <div key={item.cartKey} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-cream-dark flex-shrink-0">
                          {item.image_url
                             ? <img src={item.image_url} alt={lang === 'ar' && item.nameAr ? item.nameAr : item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">☕</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm text-charcoal truncate">{lang === 'ar' && item.nameAr ? item.nameAr : item.name}</p>
                          <p className="text-xs text-charcoal/40">
                            {item.weight && <span>{localizeWeight(item.weight, lang)} · </span>}
                            <bdi dir="ltr">× {item.quantity}</bdi>
                          </p>
                        </div>
                        <p className="text-sm text-charcoal flex-shrink-0">
                          <bdi dir="ltr">{(item.price * item.quantity).toFixed(2)}</bdi> {t('ر.ق', 'QAR')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

                  {error && pendingPaymentOrderId && (
                    <button
                      type="button"
                      onClick={retryPayment}
                      disabled={submitting}
                      className="w-full border border-sand/40 py-3 text-xs tracking-widest text-charcoal uppercase transition-colors hover:border-charcoal disabled:opacity-50"
                    >
                      {t('إعادة محاولة الدفع للطلب المحفوظ', 'Retry payment for saved order')}
                    </button>
                  )}

                  <div className="flex gap-4">
                    <button onClick={() => setStep('shipping')} className="flex-1 border border-sand/40 text-charcoal py-3.5 text-sm tracking-widest uppercase hover:border-charcoal transition-colors">
                      {t('← رجوع', '← Back')}
                    </button>
                    <button
                      onClick={placeOrder}
                       disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 bg-charcoal text-cream py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors disabled:opacity-50"
                    >
                      <Lock size={14} strokeWidth={1.5} />
                      {submitting ? t('جاري الإرسال...', 'Placing Order...') : t('تأكيد الطلب', 'Place Order')}
                    </button>
                  </div>

                  {error && step === 'review' && (
                    <p className="text-xs text-red-500 text-center">{error}</p>
                  )}
                </div>
              )}

              {step !== 'review' && error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-sand/20 p-6 sticky top-24">
                <h3 className="text-xs tracking-widest uppercase text-charcoal/50 mb-5">{t('ملخص الطلب', 'Order Summary')}</h3>

                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={item.cartKey} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 bg-cream-dark flex-shrink-0">
                        {item.image_url
                           ? <img src={item.image_url} alt={lang === 'ar' && item.nameAr ? item.nameAr : item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-sm opacity-20">☕</div>
                        }
                        <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-sand text-charcoal text-[9px] rounded-full flex items-center justify-center font-bold">
                           <bdi dir="ltr">{item.quantity}</bdi>
                        </span>
                      </div>
                      <p className="flex-1 text-xs text-charcoal line-clamp-1">
                         {lang === 'ar' && item.nameAr ? item.nameAr : item.name}{item.weight ? ` – ${localizeWeight(item.weight, lang)}` : ''}
                      </p>
                      <p className="text-xs text-charcoal flex-shrink-0">
                         <bdi dir="ltr">{(item.price * item.quantity).toFixed(2)}</bdi>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-sand/15 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-charcoal/60">
                    <span>{t('مجموع المنتجات', 'Subtotal')}</span>
                     <span><bdi dir="ltr">{total.toFixed(2)}</bdi> {t('ر.ق', 'QAR')}</span>
                  </div>
                  <div className="flex justify-between text-charcoal/60">
                    <span>{t('الشحن', 'Shipping')}</span>
                      <span>{shippingZone ? <><bdi dir="ltr">{shipping}</bdi> {t('ر.ق', 'QAR')}</> : t('اختر المنطقة', 'Choose area')}</span>
                  </div>
                  <div className="flex justify-between font-medium text-charcoal pt-2 border-t border-sand/15">
                    <span>{t('الإجمالي', 'Total')}</span>
                     <span><bdi dir="ltr">{grandTotal.toFixed(2)}</bdi> {t('ر.ق', 'QAR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Field({
  label, value, onChange, type = 'text', required = false, disabled = false
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{label}</label>
      <input
        type={type}
        dir={type === 'tel' ? 'ltr' : undefined}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete={type === 'tel' ? 'tel' : undefined}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className="w-full border border-sand/30 px-4 py-3 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors disabled:bg-cream/60 disabled:text-charcoal/60"
      />
    </div>
  )
}

function ReviewSection({
  title, onEdit, children
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  const { t } = useLang()

  return (
    <div className="border border-sand/20 p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs tracking-widest uppercase text-charcoal/50">{title}</p>
        <button onClick={onEdit} className="text-xs tracking-widest uppercase text-sand hover:text-gold transition-colors">
          {t('تعديل', 'Edit')}
        </button>
      </div>
      <div className="text-sm text-charcoal space-y-0.5">{children}</div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <CheckoutInner />
    </Suspense>
  )
}
