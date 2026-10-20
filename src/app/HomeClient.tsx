'use client'
import Link from 'next/link'
import { Bean, Candy, Citrus, Coffee, Flame, Gift, Package } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import ProductCard from '@/components/ProductCard'
import ProductGroupCard, { ProductGroup, WeightVariant } from '@/components/ProductGroupCard'
import GeometricPattern from '@/components/GeometricPattern'
import { Product } from '@/lib/types'
import { getBrandName } from '@/lib/display-text'
import { COLLECTIONS } from '@/lib/collections'

interface Props { featured: Product[] }

const WEIGHT_ORDER = ['100g', '250g', '500g', '1kg']

// Homepage: group by name only — one card per product type regardless of origin
function groupProducts(products: Product[]): Array<ProductGroup | Product> {
  const groupMap = new Map<string, Product[]>()
  const singles: Product[] = []

  for (const product of products) {
    if (product.weight) {
      if (!groupMap.has(product.name)) groupMap.set(product.name, [])
      groupMap.get(product.name)!.push(product)
    } else {
      singles.push(product)
    }
  }

  const result: Array<ProductGroup | Product> = []

  for (const [name, variants] of groupMap.entries()) {
    const sorted = [...variants].sort(
      (a, b) => WEIGHT_ORDER.indexOf(a.weight ?? '') - WEIGHT_ORDER.indexOf(b.weight ?? '')
    )
    const rep = sorted.find((v) => v.image_url) ?? sorted[0]
    const weightVariants: WeightVariant[] = sorted.map((v) => ({
      id: v.id,
      weight: v.weight ?? '',
      price: v.price,
      in_stock: v.in_stock,
      quantity: v.quantity,
    }))
    result.push({
      baseName: name,
      baseName_ar: rep.name_ar ?? null,
      category: rep.category,
      image_url: rep.image_url,
      variants: weightVariants,
      origin: null,
    } satisfies ProductGroup)
  }

  result.push(...singles)
  return result
}

function isGroup(item: ProductGroup | Product): item is ProductGroup {
  return 'baseName' in item
}

export default function HomeClient({ featured }: Props) {
  const { t, dir } = useLang()

  const grouped = groupProducts(featured)

  const bullets = [
    { ar: 'أكثر من ٥ فروع لخدمة عملائنا في قطر',           en: '5+ branches serving our customers across Qatar' },
    { ar: 'تحميص يومي لضمان أعلى درجات الجودة',            en: 'Daily roasting for the highest quality' },
    { ar: 'شريك موثوق للمقاهي والشركات والفنادق',          en: 'Trusted partner for cafés, businesses and hotels' },
    { ar: 'ثقة آلاف العملاء منذ سنوات',                     en: 'Trusted by thousands of customers for years' },
  ]

  const categoryIcons = [Coffee, Bean, Candy, Citrus, Flame, Gift, Package]

  return (
    <main className="pt-24" dir={dir}>

      {/* ── Collection gallery ── */}
      <section className="relative overflow-hidden border-y border-sand/20 bg-cream py-7 sm:py-9">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_15%_0%,rgba(194,157,94,0.16),transparent_26%),radial-gradient(circle_at_85%_100%,rgba(194,157,94,0.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-6 flex items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="h-px w-9 bg-sand" />
              <div>
                <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.38em] text-sand">
                  {t('مجموعات دوحة', 'Doha collections')}
                </p>
                <h2 className="text-lg font-light text-charcoal sm:text-xl">
                  {t('اكتشف مذاقك', 'Discover your taste')}
                </h2>
              </div>
            </div>
            <p className="text-[9px] uppercase tracking-[0.24em] text-charcoal/35">
              {t('اسحب للاستكشاف', 'Swipe to explore')}
            </p>
          </div>

          <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max snap-x snap-mandatory gap-1 lg:grid lg:min-w-0 lg:grid-cols-7 lg:gap-4">
              {COLLECTIONS.map(({ slug, ar, en }, index) => {
                const Icon = categoryIcons[index]
                return (
                  <Link
                    key={slug}
                    href={`/collections/${slug}`}
                    aria-label={t(ar, en)}
                    className="group flex w-[120px] shrink-0 snap-start flex-col items-center gap-3 py-1 text-center outline-none lg:w-auto"
                  >
                    <span className="relative flex size-[88px] items-center justify-center rounded-full border border-charcoal/10 bg-[#f4eee5] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-sand group-hover:bg-charcoal group-hover:shadow-[0_18px_40px_rgba(21,21,21,0.18)] sm:size-[98px]">
                      <span className="absolute inset-[7px] rounded-full border border-dashed border-sand/35 transition-transform duration-700 group-hover:rotate-90 group-hover:border-sand/45" />
                      <span className="absolute -end-0.5 top-2 flex size-5 items-center justify-center rounded-full border border-cream bg-charcoal font-mono text-[7px] text-cream transition-colors duration-300 group-hover:bg-sand group-hover:text-charcoal">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Icon size={31} strokeWidth={1.15} className="relative text-sand transition-all duration-500 group-hover:scale-110 group-hover:text-cream" />
                    </span>
                    <span className="relative text-[12px] font-medium leading-relaxed text-charcoal sm:text-[13px]">
                      {t(ar, en)}
                      <span className="absolute -bottom-1 start-1/2 h-px w-0 -translate-x-1/2 bg-sand transition-all duration-300 group-hover:w-full" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero ── */}
      <section className="relative min-h-[78vh] bg-charcoal flex items-center overflow-hidden">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/30" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sand to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-12 bg-sand" />
            <span className="text-sand text-xs tracking-[0.5em] uppercase">
              {t('دوحة روستري — قطر', 'Doha Roastery — Qatar')}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-light text-cream leading-[1.1] tracking-tight mb-6 max-w-3xl">
            {t('قهوة مختصة تُحمّص يوميًا في الدوحة', 'Specialty Coffee Roasted Fresh in Doha')}
          </h1>

          <p className="text-cream/60 text-lg font-light max-w-lg mb-10 leading-relaxed">
            {t(
              'نحضّرها يوميًا لعشاق القهوة والمقاهي. من محمصتنا إلى كوبك',
              'Crafted daily for cafés and coffee lovers. From our roastery to your cup.'
            )}
          </p>

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

        <div className="absolute bottom-8 start-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/20">
          <span className="text-[10px] tracking-widest">{t('استكشف', 'SCROLL')}</span>
          <div className="w-px h-10 bg-sand/30" />
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="bg-cream-dark border-y border-sand/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-sand/20">
          {[
            { num: t('٥+', '5+'),      label: t('فروع تعمل يوميًا', 'Daily Coffee Shops') },
            { num: t('يومي', 'Daily'),  label: t('تحميص طازج في الدوحة', 'Fresh Roasting in Doha') },
            { num: t('آلاف', '1000s'), label: t('عميل موثوق', 'Trusted Customers') },
            { num: t('قطر', 'Qatar'),   label: t('تغطية شاملة', 'Nationwide Coverage') },
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
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{t('مختارات', 'Featured')}</p>
            <h2 className="text-4xl font-light text-charcoal">{t('منتجاتنا المميزة', 'Our Picks')}</h2>
          </div>
          <Link href="/products">
            <span className="text-xs tracking-widest uppercase text-charcoal border-b border-charcoal pb-0.5 hover:text-sand hover:border-sand transition-colors">
              {t('عرض الكل', 'View All')}
            </span>
          </Link>
        </div>

        {grouped.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {grouped.map((item) =>
              isGroup(item) ? (
                <ProductGroupCard key={item.baseName} group={item} />
              ) : (
                <ProductCard key={(item as Product).id} product={item as Product} />
              )
            )}
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
          <div className="hidden md:flex flex-col items-center justify-center gap-6">
            <div className="w-px h-24 bg-sand/30" />
            <div className="text-sand text-7xl select-none">☕</div>
            <div className="w-px h-24 bg-sand/30" />
            <p className="text-[10px] tracking-[0.5em] uppercase text-sand/50 [writing-mode:vertical-rl]">
              {t('دوحة روستري — منذ ٢٠١٧', 'Doha Roastery — Since 2017')}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.5em] uppercase text-sand mb-4">{t('قصتنا', 'Our Story')}</p>
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
              <span className="text-sand text-xs tracking-widest uppercase">{getBrandName(dir === 'rtl' ? 'ar' : 'en')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wholesale CTA ── */}
      <section className="py-24 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{t('للأعمال', 'For Business')}</p>
          <h2 className="text-4xl font-light text-charcoal mb-6">{t('برنامج الجملة', 'Wholesale Program')}</h2>
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
