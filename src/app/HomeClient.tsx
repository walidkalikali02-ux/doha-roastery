'use client'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import ProductCard from '@/components/ProductCard'
import GeometricPattern from '@/components/GeometricPattern'
import { Product } from '@/lib/types'

interface Props { featured: Product[] }

export default function HomeClient({ featured }: Props) {
  const { t, dir } = useLang()

  const bullets = [
    {
      ar: 'نورد القهوة لمقاهي في مختلف أنحاء قطر',
      en: 'Supplying specialty coffee to cafés, offices, and hotels across Qatar',
    },
    {
      ar: 'أكثر من 5 فروع تعمل يوميًا',
      en: '5+ operating coffee shops',
    },
    {
      ar: 'تحميص يومي داخل الدوحة',
      en: 'Roasted fresh daily in Doha',
    },
    {
      ar: 'ثقة آلاف العملاء',
      en: 'Trusted by thousands of customers',
    },
  ]

  return (
    <main className="pt-16" dir={dir}>

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] bg-charcoal flex items-end overflow-hidden">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/30" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sand to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24">
          {/* Eyebrow */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-12 bg-sand" />
            <span className="text-sand text-xs tracking-[0.5em] uppercase">
              {t('دوحة رواسترز', 'Doha Roastery — Qatar')}
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-light text-cream leading-[1.1] tracking-tight mb-6 max-w-3xl">
            {t(
              'قهوة مختصة تُحمّص يوميًا في الدوحة',
              'Specialty Coffee Roasted Fresh in Doha'
            )}
          </h1>

          {/* Subtext */}
          <p className="text-cream/60 text-lg font-light max-w-lg mb-10 leading-relaxed">
            {t(
              'نحضّرها يوميًا لعشاق القهوة والمقاهي. من محمصتنا إلى كوبك',
              'Crafted daily for cafés and coffee lovers. From our roastery to your cup.'
            )}
          </p>

          {/* Bullet trust signals */}
          <ul className="flex flex-col gap-2 mb-12">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-cream/50 text-sm">
                <span className="w-1 h-1 rounded-full bg-sand flex-shrink-0" />
                {t(b.ar, b.en)}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-4">
            <Link href="/products">
              <span className="inline-block bg-sand text-charcoal px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-sand-light transition-colors">
                {t('تسوّق الآن', 'Shop Now')}
              </span>
            </Link>
            <Link href="/wholesale">
              <span className="inline-block border border-cream/30 text-cream px-8 py-4 text-sm tracking-widest uppercase hover:border-sand hover:text-sand transition-colors">
                {t('الجملة', 'Wholesale')}
              </span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 start-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/20">
          <span className="text-[10px] tracking-widest">{t('استكشف', 'SCROLL')}</span>
          <div className="w-px h-10 bg-sand/30" />
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="bg-cream-dark border-y border-sand/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-sand/20">
          {[
            { num: t('٥+', '5+'),   label: t('فروع تعمل يوميًا', 'Daily Coffee Shops') },
            { num: t('يومي', 'Daily'), label: t('تحميص طازج في الدوحة', 'Fresh Roasting in Doha') },
            { num: t('آلاف', '1000s'), label: t('عميل موثوق', 'Trusted Customers') },
            { num: t('قطر', 'Qatar'),  label: t('تغطية شاملة', 'Nationwide Coverage') },
          ].map((stat, i) => (
            <div key={i} className="text-center py-8 px-4">
              <div className="text-2xl font-light text-charcoal mb-1">{stat.num}</div>
              <div className="text-[10px] tracking-widest uppercase text-sand">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">
              {t('مختارات', 'Featured')}
            </p>
            <h2 className="text-4xl font-light text-charcoal">
              {t('منتجاتنا المميزة', 'Our Picks')}
            </h2>
          </div>
          <Link href="/products">
            <span className="text-xs tracking-widest uppercase text-charcoal border-b border-charcoal pb-0.5 hover:text-sand hover:border-sand transition-colors">
              {t('عرض الكل', 'View All')}
            </span>
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sand py-20 tracking-widest text-sm">
            {t('لا توجد منتجات بعد', 'No products yet')}
          </p>
        )}
      </section>

      {/* ── Brand Story ── */}
      <section className="relative bg-charcoal overflow-hidden">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          {/* Left: ornament */}
          <div className="hidden md:flex flex-col items-center justify-center gap-6">
            <div className="w-px h-24 bg-sand/30" />
            <div className="text-sand text-7xl select-none">☕</div>
            <div className="w-px h-24 bg-sand/30" />
            <p className="text-[10px] tracking-[0.5em] uppercase text-sand/50 [writing-mode:vertical-rl]">
              Doha Roastery — Since 2018
            </p>
          </div>

          {/* Right: story text */}
          <div>
            <p className="text-xs tracking-[0.5em] uppercase text-sand mb-4">
              {t('قصتنا', 'Our Story')}
            </p>
            <p className="text-cream/80 text-xl md:text-2xl font-light leading-relaxed mb-8">
              {t(
                'بدأت دوحة روستري بهدف واحد — تقديم قهوة استثنائية في قطر.',
                'Doha Roastery was built with one goal — to serve exceptional coffee across Qatar.'
              )}
            </p>
            <p className="text-cream/50 leading-loose text-sm mb-8">
              {t(
                'نحمّص يوميًا ونشغّل عدة مقاهي، لذلك نفهم القهوة من جميع جوانبها — من الإنتاج إلى التجربة.',
                'From roasting beans daily to operating multiple coffee shops, we understand coffee from both sides — production and experience.'
              )}
            </p>
            <p className="text-cream/50 leading-loose text-sm">
              {t(
                'اليوم نفخر بتوريد القهوة لعملاء ومقاهي تهتم بالجودة والثبات في الطعم.',
                'Today, we proudly supply cafés and customers who value quality, consistency, and taste.'
              )}
            </p>

            <div className="mt-10 flex items-center gap-4">
              <span className="h-px w-8 bg-sand" />
              <span className="text-sand text-xs tracking-widest uppercase">{t('دوحة رواسترز', 'Doha Roastery')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wholesale CTA ── */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">
            {t('للأعمال', 'For Business')}
          </p>
          <h2 className="text-4xl font-light text-charcoal mb-6">
            {t('برنامج الجملة', 'Wholesale Program')}
          </h2>
          <p className="text-charcoal/60 leading-relaxed mb-8">
            {t(
              'نورد القهوة للمقاهي والفنادق والشركات في مختلف أنحاء قطر. تواصل معنا لمعرفة المزيد.',
              'We supply cafés, hotels, and offices across Qatar. Get in touch to learn more about our wholesale pricing.'
            )}
          </p>
          <Link href="/wholesale">
            <span className="inline-block bg-charcoal text-cream px-8 py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors">
              {t('تعرّف على البرنامج', 'Learn More')}
            </span>
          </Link>
        </div>

        {/* Trust bullets panel */}
        <div className="relative bg-cream-dark border border-sand/20 p-10 overflow-hidden">
          <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
          <ul className="relative z-10 space-y-5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sand flex-shrink-0" />
                <span className="text-sm text-charcoal/70 leading-relaxed">{t(b.ar, b.en)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </main>
  )
}
