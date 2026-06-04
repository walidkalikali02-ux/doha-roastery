'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Lock } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type Step = 'info' | 'shipping' | 'review'

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

export default function CheckoutPage() {
  const { t, dir } = useLang()
  const { items, total, clear } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<Step>('info')
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shipping = total >= 200 ? 0 : 15
  const grandTotal = total + shipping

  function f(key: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [key]: e.target.value })
  }

  async function placeOrder() {
    setSubmitting(true)
    setError(null)
    try {
      const orderNum = `DR-${Date.now()}`
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          guest_email: form.email,
          status: 'pending',
          subtotal: total,
          shipping_cost: shipping,
          discount_amount: 0,
          total: grandTotal,
          shipping_address: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            area: form.area,
          },
        })
        .select()
        .single()

      if (orderErr || !order) throw orderErr ?? new Error('Order creation failed')

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
      if (itemsErr) throw itemsErr

      // Fire order notification (admin email + customer email + realtime dashboard)
      supabase.functions.invoke('order-notification', {
        body: {
          order_id: order.id,
          order_number: orderNum,
          guest_email: form.email,
          customer_name: `${form.firstName} ${form.lastName}`,
          total: grandTotal,
          items: items.map(i => ({ name: `${i.name}${i.weight ? ` – ${i.weight}` : ''}${i.grind ? ` (${i.grind})` : ''}`, quantity: i.quantity, price: i.price })),
          shipping_address: {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            area: form.area,
          },
        },
      }).catch(() => {}) // non-blocking — don't fail the order if notification fails

      clear()
      router.push(`/checkout/success?order=${orderNum}&total=${grandTotal.toFixed(2)}&email=${encodeURIComponent(form.email)}`)
    } catch (e: unknown) {
      setError((e as Error).message ?? t('حدث خطأ. حاول مجدداً.', 'Something went wrong. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-16 min-h-screen flex items-center justify-center" dir={dir}>
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
  const stepIndex = steps.findIndex((s) => s.key === step)

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-cream" dir={dir}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-charcoal/40 mb-10">
            <Link href="/cart" className="hover:text-sand transition-colors">{t('السلة', 'Cart')}</Link>
            {steps.map((s, i) => (
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
                    <Field label={t('البريد الإلكتروني *', 'Email *')} type="email" value={form.email} onChange={f('email')} required />
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t('الاسم الأول *', 'First Name *')} value={form.firstName} onChange={f('firstName')} required />
                      <Field label={t('اسم العائلة *', 'Last Name *')} value={form.lastName} onChange={f('lastName')} required />
                    </div>
                    <Field label={t('رقم الهاتف *', 'Phone *')} type="tel" value={form.phone} onChange={f('phone')} required />
                  </div>

                  <button
                    onClick={() => {
                      if (!form.email || !form.firstName || !form.lastName || !form.phone) {
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
                        <p className="text-xs text-charcoal/50 mt-0.5">{t('2-4 أيام عمل', '2-4 business days')}</p>
                      </div>
                      <p className="text-sm font-medium text-charcoal">
                        {shipping === 0 ? <span className="text-green-700">{t('مجاني', 'Free')}</span> : `${shipping} ${t('ر.ق', 'QAR')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep('info')} className="flex-1 border border-sand/40 text-charcoal py-3.5 text-sm tracking-widest uppercase hover:border-charcoal transition-colors">
                      {t('← رجوع', '← Back')}
                    </button>
                    <button
                      onClick={() => {
                        if (!form.area || !form.city || !form.address) {
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
                    <p>{form.email}</p>
                    <p>{form.firstName} {form.lastName}</p>
                    <p>{form.phone}</p>
                  </ReviewSection>

                  {/* Shipping summary */}
                  <ReviewSection title={t('عنوان التوصيل', 'Delivery Address')} onEdit={() => setStep('shipping')}>
                    <p>{form.address}</p>
                    <p>{form.area}، {form.city}</p>
                    {form.notes && <p className="text-charcoal/50 italic">{form.notes}</p>}
                  </ReviewSection>

                  {/* Items summary */}
                  <div className="border border-sand/20 bg-white p-5 space-y-3">
                    {items.map((item) => (
                      <div key={item.cartKey} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-cream-dark flex-shrink-0">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">☕</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-charcoal truncate">{item.name}</p>
                          <p className="text-xs text-charcoal/40">
                            {item.weight && <span>{item.weight} · </span>}
                            × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm text-charcoal flex-shrink-0">
                          {(item.price * item.quantity).toFixed(2)} {t('ر.ق', 'QAR')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
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
                          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-sm opacity-20">☕</div>
                        }
                        <span className="absolute -top-1.5 -end-1.5 w-4 h-4 bg-sand text-charcoal text-[9px] rounded-full flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <p className="flex-1 text-xs text-charcoal line-clamp-1">
                        {item.name}{item.weight ? ` – ${item.weight}` : ''}
                      </p>
                      <p className="text-xs text-charcoal flex-shrink-0">
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-sand/15 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-charcoal/60">
                    <span>{t('مجموع المنتجات', 'Subtotal')}</span>
                    <span>{total.toFixed(2)} {t('ر.ق', 'QAR')}</span>
                  </div>
                  <div className="flex justify-between text-charcoal/60">
                    <span>{t('الشحن', 'Shipping')}</span>
                    <span>{shipping === 0 ? <span className="text-green-700">{t('مجاني', 'Free')}</span> : `${shipping} ${t('ر.ق', 'QAR')}`}</span>
                  </div>
                  <div className="flex justify-between font-medium text-charcoal pt-2 border-t border-sand/15">
                    <span>{t('الإجمالي', 'Total')}</span>
                    <span>{grandTotal.toFixed(2)} {t('ر.ق', 'QAR')}</span>
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
  label, value, onChange, type = 'text', required = false
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full border border-sand/30 px-4 py-3 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal transition-colors"
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
  return (
    <div className="border border-sand/20 p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs tracking-widest uppercase text-charcoal/50">{title}</p>
        <button onClick={onEdit} className="text-xs tracking-widest uppercase text-sand hover:text-gold transition-colors">
          تعديل / Edit
        </button>
      </div>
      <div className="text-sm text-charcoal space-y-0.5">{children}</div>
    </div>
  )
}
