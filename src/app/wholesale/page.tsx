'use client'
import { useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GeometricPattern from '@/components/GeometricPattern'
import { CheckCircle, Package, Truck, HeartHandshake, MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '97466788898'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export default function WholesalePage() {
  const { t, dir } = useLang()
  const [form, setForm] = useState({
    name: '', business: '', email: '', phone: '', message: '', volume: '',
  })
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  const perks = [
    {
      icon: Package,
      title: t('أسعار تنافسية', 'Competitive Pricing'),
      desc: t('أسعار خاصة بالجملة تتدرج مع حجم الطلب.', 'Tiered wholesale pricing based on order volume.'),
    },
    {
      icon: Truck,
      title: t('توصيل موثوق', 'Reliable Delivery'),
      desc: t('توصيل منتظم وفقًا لجدولك الزمني.', 'Regular delivery on your schedule.'),
    },
    {
      icon: HeartHandshake,
      title: t('دعم مخصص', 'Dedicated Support'),
      desc: t('مدير حساب خاص لكل عميل.', 'A dedicated account manager for every client.'),
    },
    {
      icon: CheckCircle,
      title: t('جودة مضمونة', 'Guaranteed Quality'),
      desc: t('كل دُفعة تحمّص طازجة وتُشحن مباشرة.', 'Every batch roasted fresh and shipped directly.'),
    },
  ]

  return (
    <>
      <Header />
      <main className="pt-16" dir={dir}>
        {/* Hero */}
        <section className="relative bg-charcoal py-28 overflow-hidden">
          <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <p className="text-sand text-xs tracking-[0.5em] uppercase mb-4">
              {t('للأعمال', 'For Business')}
            </p>
            <h1 className="text-5xl md:text-6xl font-light text-cream max-w-lg leading-tight">
              {t('برنامج الجملة', 'Wholesale Program')}
            </h1>
            <p className="text-cream/50 mt-6 max-w-md leading-relaxed">
              {t(
                'شراكة تجارية تضعك في مقدمة مزودي القهوة الفاخرة.',
                'A business partnership that places you at the forefront of specialty coffee supply.'
              )}
            </p>
          </div>
        </section>

        {/* Perks */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {perks.map((p, i) => (
              <div key={i} className="border border-sand/20 p-8 hover:border-sand/60 transition-colors">
                <p.icon size={28} strokeWidth={1.2} className="text-sand mb-4" />
                <h3 className="font-medium text-charcoal mb-2">{p.title}</h3>
                <p className="text-sm text-charcoal/60 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing tiers */}
        <section className="bg-cream-dark py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{t('الأسعار', 'Pricing')}</p>
              <h2 className="text-4xl font-light text-charcoal">{t('خطط الجملة', 'Wholesale Tiers')}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { tier: t('برونزي', 'Bronze'), qty: '10–50 كجم / 10–50 kg', disc: '10%', color: 'border-sand' },
                { tier: t('فضي', 'Silver'), qty: '51–150 كجم / 51–150 kg', disc: '18%', color: 'border-gold bg-charcoal text-cream' },
                { tier: t('ذهبي', 'Gold'), qty: '150+ كجم / 150+ kg', disc: '25%', color: 'border-sand' },
              ].map((t2, i) => (
                <div
                  key={i}
                  className={`border-2 p-10 text-center ${t2.color} ${i === 1 ? 'text-cream' : 'text-charcoal'}`}
                >
                  <div className="text-xs tracking-widest uppercase mb-4 text-sand">{t2.tier}</div>
                  <div className="text-5xl font-light mb-3">{t2.disc}</div>
                  <div className="text-xs tracking-widest opacity-60 uppercase mb-6">{t('خصم', 'Discount')}</div>
                  <div className="text-sm opacity-70">{t2.qty}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact form */}
        <section className="py-24 max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{t('تواصل', 'Get In Touch')}</p>
            <h2 className="text-4xl font-light text-charcoal">{t('طلب شراكة', 'Apply for Partnership')}</h2>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 bg-[#25D366] text-white px-6 py-5 mb-10 hover:bg-[#1ebe5d] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <MessageCircle size={28} strokeWidth={1.5} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-medium tracking-wide">
                  {t('تواصل معنا عبر واتساب', 'Contact us on WhatsApp')}
                </p>
                <p className="text-white/70 text-xs mt-0.5 tracking-widest">
                  +974 6678 8898
                </p>
              </div>
            </div>
            <span className="text-xs tracking-widest uppercase text-white/70 group-hover:text-white transition-colors">
              {t('ابدأ المحادثة ←', '← Chat Now')}
            </span>
          </a>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-sand/20" />
            <span className="text-xs tracking-widest uppercase text-charcoal/30">
              {t('أو أرسل طلبك', 'or send a request')}
            </span>
            <div className="flex-1 h-px bg-sand/20" />
          </div>

          {sent ? (
            <div className="text-center py-16 border border-sand/30">
              <CheckCircle size={40} className="text-sand mx-auto mb-4" strokeWidth={1} />
              <h3 className="text-xl font-light text-charcoal mb-2">
                {t('تم إرسال طلبك', 'Request Sent')}
              </h3>
              <p className="text-sm text-charcoal/60 mb-8">
                {t('سنتواصل معك خلال 24 ساعة.', 'We\'ll reach out within 24 hours.')}
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 text-sm tracking-widest uppercase hover:bg-[#1ebe5d] transition-colors"
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                {t('تواصل عبر واتساب', 'Chat on WhatsApp')}
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { key: 'name', label: t('الاسم الكامل', 'Full Name'), required: true },
                { key: 'business', label: t('اسم المؤسسة', 'Business Name'), required: true },
                { key: 'email', label: t('البريد الإلكتروني', 'Email'), required: true, type: 'email' },
                { key: 'phone', label: t('رقم الهاتف', 'Phone'), required: false, type: 'tel' },
                { key: 'volume', label: t('الكمية المتوقعة شهريًا (كجم)', 'Expected Monthly Volume (kg)'), required: false },
              ].map((field) => (
                <div key={field.key} className={field.key === 'volume' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs tracking-widest uppercase text-charcoal/60 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type ?? 'text'}
                    required={field.required}
                    value={(form as Record<string, string>)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full border border-sand/30 bg-transparent px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors"
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest uppercase text-charcoal/60 mb-2">
                  {t('رسالة إضافية', 'Additional Message')}
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-sand/30 bg-transparent px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal transition-colors resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors"
                >
                  {t('إرسال الطلب', 'Send Request')}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
