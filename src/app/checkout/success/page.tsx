'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { CheckCircle, Package, ArrowRight, XCircle, RotateCcw } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GeometricPattern from '@/components/GeometricPattern'
import { DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN } from '@/lib/display-text'

function SuccessContent() {
  const { t, dir, lang } = useLang()
  const params = useSearchParams()
  const router = useRouter()
  const { addItem } = useCart()
  const orderNum = params.get('order') ?? '—'
  const paymentParam = params.get('payment')
  const [paymentStatus, setPaymentStatus] = useState<string>(paymentParam ?? 'confirmed')
  const [total, setTotal] = useState<string>('—')
  const [email, setEmail] = useState<string>('')
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderNum || orderNum === '—') return
    let cancelled = false
    supabase
      .rpc('get_order_summary', { p_order_number: orderNum })
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return
        const row = data as { total: number; guest_email: string | null; status?: string }
        setTotal(Number(row.total ?? 0).toFixed(2))
        setEmail(row.guest_email ?? '')
        if (paymentParam && row.status) setPaymentStatus(row.status)
      })
    return () => { cancelled = true }
  }, [orderNum, paymentParam])

  async function restoreAndRetry() {
    if (!orderNum || orderNum === '—') return
    setRetrying(true)
    setRetryError(null)
    try {
      const { data, error } = await supabase
        .rpc('get_order_for_retry', { p_order_number: orderNum })
        .single()
      if (error || !data) throw error ?? new Error('not retryable')
      const result = data as { order_id: string; items: Array<{
        id: string; name: string; nameAr: string | null; weight: string | null
        grind: string; notes: string; price: number; image_url: string | null; quantity: number
      }> }
      for (const item of result.items) {
        for (let q = 0; q < item.quantity; q++) {
          addItem({
            id: item.id,
            name: item.name,
            nameAr: item.nameAr,
            weight: item.weight ?? '',
            grind: item.grind,
            notes: item.notes,
            price: item.price,
            image_url: item.image_url,
          })
        }
      }
      router.push(`/checkout?retry=${encodeURIComponent(result.order_id)}`)
    } catch {
      setRetryError(t('تعذر استعادة الطلب. يرجى المحاولة مجدداً.', 'Could not restore order. Please try again.'))
      setRetrying(false)
    }
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-cream" dir={dir}>
        {/* Top gold line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-sand to-transparent" />

        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
            <div className={`absolute inset-0 rounded-full ${paymentStatus === 'payment_failed' || paymentStatus === 'failed' ? 'bg-red-100' : 'bg-sand/10'}`} />
            {paymentStatus === 'payment_failed' || paymentStatus === 'failed'
              ? <XCircle size={48} strokeWidth={1} className="text-red-500 relative z-10" />
              : <CheckCircle size={48} strokeWidth={1} className="text-sand relative z-10" />}
          </div>

          <p className="text-xs tracking-[0.5em] uppercase text-sand mb-3">
             {paymentStatus === 'payment_failed' || paymentStatus === 'failed'
               ? t('تعذر إتمام الدفع', 'Payment Failed')
               : paymentStatus === 'pending' || paymentStatus === 'error'
                 ? t('الدفع قيد التحقق', 'Payment Verification Pending')
                 : t('تم الطلب بنجاح', 'Order Confirmed')}
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-charcoal mb-4">
             {paymentStatus === 'payment_failed' || paymentStatus === 'failed'
               ? t('لم تتم عملية الدفع', 'Payment was not completed')
               : t('شكراً لك!', 'Thank You!')}
          </h1>
          <p className="text-charcoal/60 text-lg mb-3">
            {t(
               paymentStatus === 'paid'
                 ? 'تم استلام دفعتك وسيتم تجهيز طلبك قريباً.'
                 : paymentStatus === 'payment_failed' || paymentStatus === 'failed'
                   ? 'يمكنك العودة والمحاولة باستخدام طريقة دفع أخرى.'
                   : 'تم استلام طلبك، وسيتم تحديث حالة الدفع تلقائياً.',
               paymentStatus === 'paid'
                 ? 'Your payment was received and your order will be prepared shortly.'
                 : paymentStatus === 'payment_failed' || paymentStatus === 'failed'
                   ? 'You can return and try again with another payment method.'
                   : 'Your order was received. Payment status is still being verified.'
             )}
          </p>
          {email && (
            <p className="text-sm text-sand mb-10">
              {t(`تم إرسال تأكيد الطلب إلى ${email}`, `Order confirmation sent to ${email}`)}
            </p>
          )}

          {/* Order details card */}
          <div className="relative bg-charcoal text-cream p-8 mb-10 overflow-hidden text-start">
            <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-10" />
            <div className="relative z-10 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-sand mb-1">
                  {t('رقم الطلب', 'Order Number')}
                </p>
                <p className="text-lg font-light"><bdi dir="ltr">#{orderNum.startsWith('DR-') ? orderNum.slice(3, 11) : orderNum}</bdi></p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-sand mb-1">
                  {t('الإجمالي', 'Total')}
                </p>
                <p className="text-lg font-light"><bdi dir="ltr">{total}</bdi> {t('ر.ق', 'QAR')}</p>
              </div>
              {paymentStatus !== 'payment_failed' && paymentStatus !== 'failed' && (
                <div className="col-span-2">
                  <p className="text-[10px] tracking-widest uppercase text-sand mb-1">
                    {t('موعد التوصيل المتوقع', 'Estimated Delivery')}
                  </p>
                  <p className="text-sm text-cream/70">{t(DELIVERY_WINDOW_AR, DELIVERY_WINDOW_EN)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Steps — only shown for successful/pending payments */}
          {paymentStatus !== 'payment_failed' && paymentStatus !== 'failed' && (
            <div className="grid grid-cols-3 gap-4 mb-12 text-center">
              {[
                { icon: CheckCircle, label: t('تأكيد الطلب', 'Order Confirmed'), done: paymentStatus === 'paid' || paymentStatus === 'confirmed' },
                { icon: Package, label: t('قيد التجهيز', 'Processing'), done: false },
                { icon: ArrowRight, label: t('في الطريق', 'On the Way'), done: false },
              ].map((step, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 ${step.done ? 'text-charcoal' : 'text-charcoal/30'}`}>
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${step.done ? 'border-sand bg-sand/10' : 'border-sand/20'}`}>
                    <step.icon size={18} strokeWidth={1.5} />
                  </div>
                  <p className="text-[10px] tracking-widest uppercase">{step.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {paymentStatus === 'payment_failed' || paymentStatus === 'failed' ? (
              <>
                {retryError && (
                  <p className="text-red-500 text-sm mb-2">{retryError}</p>
                )}
                <button
                  onClick={restoreAndRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 bg-charcoal text-cream px-8 py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors disabled:opacity-60"
                >
                  <RotateCcw size={14} strokeWidth={1.5} className={retrying ? 'animate-spin' : ''} />
                  {retrying
                    ? t('جارٍ الاسترداد...', 'Restoring...')
                    : t('إعادة محاولة الدفع', 'Retry Payment')}
                </button>
                <Link href="/">
                  <span className="inline-block border border-charcoal/30 text-charcoal px-8 py-3.5 text-sm tracking-widest uppercase hover:border-charcoal transition-colors">
                    {t('الصفحة الرئيسية', 'Home')}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/products">
                  <span className="inline-block bg-charcoal text-cream px-8 py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors">
                    {t('متابعة التسوق', 'Continue Shopping')}
                  </span>
                </Link>
                <Link href="/">
                  <span className="inline-block border border-charcoal/30 text-charcoal px-8 py-3.5 text-sm tracking-widest uppercase hover:border-charcoal transition-colors">
                    {t('الصفحة الرئيسية', 'Home')}
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <SuccessContent />
    </Suspense>
  )
}
