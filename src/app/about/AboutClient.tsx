'use client'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GeometricPattern from '@/components/GeometricPattern'
import { Coffee, MapPin, Users, Award } from 'lucide-react'

export default function AboutClient() {
  const { t, dir } = useLang()

  const values = [
    {
      icon: Coffee,
      title: t('الجودة أولاً', 'Quality First'),
      desc: t(
        'نختار كل حبة قهوة بعناية من أفضل المزارع حول العالم، ونحمّصها يومياً للحفاظ على أعلى مستوى من النضارة.',
        'We carefully select every coffee bean from the world\'s finest farms, roasting daily to maintain the highest level of freshness.'
      ),
    },
    {
      icon: MapPin,
      title: t('من الدوحة للعالم', 'From Doha to the World'),
      desc: t(
        'محمصتنا في قلب الدوحة تُنتج قهوة تُشحن لعملاء في قطر ودول الخليج.',
        'Our roastery in the heart of Doha produces coffee shipped to customers across Qatar and the Gulf.'
      ),
    },
    {
      icon: Users,
      title: t('مجتمع القهوة', 'Coffee Community'),
      desc: t(
        'نبني مجتمعاً من عشاق القهوة من خلال تجارب تعليمية وفعاليات تذوق دورية.',
        'We build a community of coffee lovers through educational experiences and regular tasting events.'
      ),
    },
    {
      icon: Award,
      title: t('شراكات موثوقة', 'Trusted Partnerships'),
      desc: t(
        'نزوّد أكثر من 5 فروع ومقاهي وفنادق بالقهوة المتخصصة في قطر.',
        'We supply specialty coffee to 5+ branches, cafés, and hotels across Qatar.'
      ),
    },
  ]

  const milestones = [
    { year: '2018', ar: 'تأسيس دوحة روستري في الدوحة', en: 'Doha Roastery founded in Doha' },
    { year: '2019', ar: 'افتتاح أول فرع للمقهى', en: 'First café branch opened' },
    { year: '2021', ar: 'توسع في سوق الجملة لقطر', en: 'Expanded into wholesale market across Qatar' },
    { year: '2022', ar: 'إطلاق المتجر الإلكتروني', en: 'Online store launched' },
    { year: '2024', ar: 'أكثر من 5 فروع تعمل يومياً', en: '5+ branches operating daily' },
  ]

  return (
    <>
      <Header />
      <main className="pt-16" dir={dir}>

        {/* Hero */}
        <section className="relative bg-charcoal py-28 overflow-hidden">
          <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 to-charcoal/90" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="text-sand text-xs tracking-[0.5em] uppercase mb-4">
              {t('من نحن', 'About Us')}
            </p>
            <h1 className="text-5xl md:text-6xl font-light text-cream mb-6">
              {t('دوحة روستري', 'Doha Roastery')}
            </h1>
            <p className="text-cream/60 text-lg font-light max-w-xl mx-auto leading-relaxed">
              {t(
                'قهوة مختصة تُحمّص يوميًا في الدوحة — من محمصتنا إلى كوبك',
                'Specialty coffee roasted fresh daily in Doha — from our roastery to your cup'
              )}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.5em] uppercase text-sand mb-3">{t('قصتنا', 'Our Story')}</p>
            <h2 className="text-4xl font-light text-charcoal mb-8 leading-snug">
              {t('بدأنا بهدف واحد', 'We started with one goal')}
            </h2>
            <div className="space-y-5 text-charcoal/70 leading-loose">
              <p>
                {t(
                  'بدأت دوحة روستري بهدف واحد — تقديم قهوة استثنائية في قطر. كنّا نؤمن بأن القهوة الجيدة تستحق أن تُحمَّص بشكل يومي وتقدَّم طازجة، لا أن تجلس في المستودعات لأشهر.',
                  'Doha Roastery was built with one goal — to serve exceptional coffee across Qatar. We believed that great coffee deserves to be roasted daily and served fresh, not sitting in warehouses for months.'
                )}
              </p>
              <p>
                {t(
                  'نحمّص يوميًا ونشغّل عدة مقاهي، لذلك نفهم القهوة من جميع جوانبها — من الإنتاج إلى التجربة. هذا الفهم المزدوج يميّزنا.',
                  'From roasting beans daily to operating multiple coffee shops, we understand coffee from both sides — production and experience. This dual understanding sets us apart.'
                )}
              </p>
              <p>
                {t(
                  'اليوم نفخر بتوريد القهوة لعملاء ومقاهي وفنادق تهتم بالجودة والثبات في الطعم في مختلف أنحاء قطر.',
                  'Today, we proudly supply cafés, hotels, and customers who value quality, consistency, and taste across Qatar.'
                )}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: t('٢٠١٨', '2018'), label: t('سنة التأسيس', 'Founded') },
              { num: t('٥+', '5+'),    label: t('فروع تعمل يومياً', 'Daily Branches') },
              { num: t('يومي', 'Daily'), label: t('تحميص طازج', 'Fresh Roasting') },
              { num: t('آلاف', '1000s'), label: t('عميل موثوق', 'Happy Customers') },
            ].map((s, i) => (
              <div key={i} className="bg-cream-dark border border-sand/20 p-8 text-center">
                <div className="text-3xl font-light text-charcoal mb-2">{s.num}</div>
                <div className="text-[10px] tracking-widest uppercase text-sand">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-cream-dark py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-xs tracking-[0.5em] uppercase text-sand mb-3">{t('ما يميّزنا', 'What Defines Us')}</p>
              <h2 className="text-4xl font-light text-charcoal">{t('قيمنا', 'Our Values')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <div key={i} className="bg-white border border-sand/20 p-8 hover:border-sand/50 transition-colors">
                  <v.icon size={28} strokeWidth={1.2} className="text-sand mb-5" />
                  <h3 className="font-medium text-charcoal mb-3">{v.title}</h3>
                  <p className="text-sm text-charcoal/60 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.5em] uppercase text-sand mb-3">{t('رحلتنا', 'Our Journey')}</p>
            <h2 className="text-4xl font-light text-charcoal">{t('المحطات الكبرى', 'Milestones')}</h2>
          </div>
          <div className="relative">
            <div className="absolute start-8 top-0 bottom-0 w-px bg-sand/20" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-8">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-charcoal flex items-center justify-center text-sand text-xs font-medium tracking-widest z-10 relative">
                      {m.year}
                    </div>
                  </div>
                  <div className="flex-1 pt-4 pb-4 border-b border-sand/15">
                    <p className="text-charcoal leading-relaxed">{t(m.ar, m.en)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative bg-charcoal py-20 overflow-hidden">
          <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-10" />
          <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
            <p className="text-sand text-xs tracking-[0.5em] uppercase mb-4">{t('تواصل معنا', 'Get In Touch')}</p>
            <h2 className="text-4xl font-light text-cream mb-8">
              {t('هل أنت مقهى أو فندق؟', 'A Café or Hotel?')}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/wholesale">
                <span className="inline-block bg-sand text-charcoal px-8 py-4 text-sm tracking-widest uppercase hover:bg-sand-light transition-colors">
                  {t('برنامج الجملة', 'Wholesale Program')}
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-block border border-cream/30 text-cream px-8 py-4 text-sm tracking-widest uppercase hover:border-sand hover:text-sand transition-colors">
                  {t('تواصل معنا', 'Contact Us')}
                </span>
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
