'use client'
import { useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GeometricPattern from '@/components/GeometricPattern'
import { MessageCircle, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react'

function IconInstagram({ size = 16 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconX({ size = 16 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

const WHATSAPP = 'https://wa.me/97466788898'

export default function ContactPage() {
  const { t, dir } = useLang()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function f(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  const info = [
    {
      icon: MessageCircle,
      label: t('واتساب', 'WhatsApp'),
      value: '+974 6678 8898',
      href: WHATSAPP,
      green: true,
    },
    {
      icon: Mail,
      label: t('البريد الإلكتروني', 'Email'),
      value: 'info@doharoastery.com',
      href: 'mailto:info@doharoastery.com',
    },
    {
      icon: MapPin,
      label: t('الموقع', 'Location'),
      value: t('الدوحة، قطر', 'Doha, Qatar'),
      href: 'https://maps.google.com/?q=Doha,Qatar',
    },
    {
      icon: Clock,
      label: t('ساعات العمل', 'Working Hours'),
      value: t('السبت – الخميس: ٨ص – ١٠م', 'Sat – Thu: 8AM – 10PM'),
      href: null,
    },
  ]

  const subjects = [
    t('استفسار عام', 'General Inquiry'),
    t('طلب جملة', 'Wholesale Inquiry'),
    t('شكوى أو مقترح', 'Complaint / Suggestion'),
    t('دعم طلب', 'Order Support'),
    t('أخرى', 'Other'),
  ]

  return (
    <>
      <Header />
      <main className="pt-16" dir={dir}>

        {/* Hero */}
        <section className="relative bg-charcoal py-24 overflow-hidden">
          <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="text-sand text-xs tracking-[0.5em] uppercase mb-4">{t('نحن هنا', "We're Here")}</p>
            <h1 className="text-5xl md:text-6xl font-light text-cream mb-4">
              {t('تواصل معنا', 'Contact Us')}
            </h1>
            <p className="text-cream/50 text-lg font-light max-w-lg mx-auto">
              {t('يسعدنا الرد عليك في أقرب وقت ممكن', "We'd love to hear from you — we'll respond as soon as possible")}
            </p>
          </div>
        </section>

        {/* WhatsApp CTA banner */}
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-4 bg-[#25D366] text-white py-5 px-6 hover:bg-[#1ebe5d] transition-colors"
        >
          <MessageCircle size={22} strokeWidth={1.5} />
          <span className="text-sm font-medium tracking-wide">
            {t('تحدّث معنا مباشرةً على واتساب — +974 6678 8898', 'Chat with us directly on WhatsApp — +974 6678 8898')}
          </span>
        </a>

        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-5 gap-14">

          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-xs tracking-[0.5em] uppercase text-sand mb-2">{t('معلومات التواصل', 'Contact Info')}</p>
              <h2 className="text-3xl font-light text-charcoal">{t('كيف تجدنا', 'Find Us')}</h2>
            </div>

            <div className="space-y-4">
              {info.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 border border-sand/20 bg-white hover:border-sand/50 transition-colors">
                  <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${item.green ? 'bg-[#25D366]/10' : 'bg-cream-dark'}`}>
                    <item.icon size={18} strokeWidth={1.3} className={item.green ? 'text-[#25D366]' : 'text-sand'} />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-sm text-charcoal hover:text-sand transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-charcoal">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="pt-4">
              <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-4">{t('تابعنا', 'Follow Us')}</p>
              <div className="flex gap-3">
                {[
                  { icon: IconInstagram, href: 'https://instagram.com/doharoastery', label: 'Instagram' },
                  { icon: IconX, href: 'https://twitter.com/doharoastery', label: 'X (Twitter)' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 border border-sand/30 flex items-center justify-center text-charcoal hover:border-sand hover:text-sand transition-colors"
                    aria-label={s.label}>
                    <s.icon size={16} strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <p className="text-xs tracking-[0.5em] uppercase text-sand mb-2">{t('راسلنا', 'Send a Message')}</p>
              <h2 className="text-3xl font-light text-charcoal">{t('نموذج التواصل', 'Contact Form')}</h2>
            </div>

            {sent ? (
              <div className="text-center py-16 border border-sand/20 bg-white">
                <CheckCircle size={44} strokeWidth={1} className="text-sand mx-auto mb-5" />
                <h3 className="text-2xl font-light text-charcoal mb-3">
                  {t('تم إرسال رسالتك!', 'Message Sent!')}
                </h3>
                <p className="text-sm text-charcoal/50 mb-8 max-w-sm mx-auto">
                  {t('شكراً لتواصلك. سنرد عليك خلال 24 ساعة عمل.', 'Thank you for reaching out. We\'ll reply within 24 business hours.')}
                </p>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-[#1ebe5d] transition-colors">
                  <MessageCircle size={15} strokeWidth={1.5} />
                  {t('أو تحدّث معنا على واتساب', 'Or chat on WhatsApp')}
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-sand/20 p-8">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                      {t('الاسم *', 'Name *')}
                    </label>
                    <input required type="text" value={form.name} onChange={f('name')}
                      className="w-full border border-sand/30 px-4 py-3 text-sm text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                      {t('البريد الإلكتروني *', 'Email *')}
                    </label>
                    <input required type="email" value={form.email} onChange={f('email')}
                      className="w-full border border-sand/30 px-4 py-3 text-sm text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                    {t('الموضوع', 'Subject')}
                  </label>
                  <select value={form.subject} onChange={f('subject')}
                    className="w-full border border-sand/30 px-4 py-3 text-sm text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors">
                    <option value="">{t('اختر موضوعاً', 'Select a subject')}</option>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs tracking-widest uppercase text-charcoal/50 mb-2">
                    {t('رسالتك *', 'Message *')}
                  </label>
                  <textarea required rows={5} value={form.message} onChange={f('message')}
                    placeholder={t('اكتب رسالتك هنا...', 'Write your message here...')}
                    className="w-full border border-sand/30 px-4 py-3 text-sm text-charcoal bg-cream focus:outline-none focus:border-charcoal transition-colors resize-none" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors disabled:opacity-50">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                    : <Send size={14} strokeWidth={1.5} />
                  }
                  {loading ? t('جاري الإرسال...', 'Sending...') : t('إرسال الرسالة', 'Send Message')}
                </button>
              </form>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
