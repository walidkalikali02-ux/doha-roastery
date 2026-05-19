'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GeometricPattern from '@/components/GeometricPattern'

function SuccessContent() {
  const { t, dir } = useLang()
  const params = useSearchParams()
  const orderNum = params.get('order') ?? '—'
  const total    = params.get('total') ?? '0'
  const email    = params.get('email') ?? ''

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-cream" dir={dir}>
        {/* Top gold line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-sand to-transparent" />

        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          {/* Icon */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-8">
            <div className="absolute inset-0 bg-sand/10 rounded-full" />
            <CheckCircle size={48} strokeWidth={1} className="text-sand relative z-10" />
          </div>

          <p className="text-xs tracking-[0.5em] uppercase text-sand mb-3">
            {t('تم الطلب بنجاح', 'Order Confirmed')}
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-charcoal mb-4">
            {t('شكراً لك!', 'Thank You!')}
          </h1>
          <p className="text-charcoal/60 text-lg mb-3">
            {t(
              'تم استلام طلبك وسيتم التواصل معك قريباً.',
              'Your order has been received and we\'ll be in touch shortly.'
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
                <p className="text-lg font-light">{orderNum}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-sand mb-1">
                  {t('الإجمالي', 'Total')}
                </p>
                <p className="text-lg font-light">{total} {t('ر.ق', 'QAR')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] tracking-widest uppercase text-sand mb-1">
                  {t('موعد التوصيل المتوقع', 'Estimated Delivery')}
                </p>
                <p className="text-sm text-cream/70">{t('2-4 أيام عمل', '2-4 business days')}</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-4 mb-12 text-center">
            {[
              { icon: CheckCircle, label: t('تأكيد الطلب', 'Order Confirmed'), done: true },
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

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
