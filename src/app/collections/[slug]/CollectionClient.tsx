'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Bean, Candy, Citrus, Coffee, Flame, Gift, Package } from 'lucide-react'
import GeometricPattern from '@/components/GeometricPattern'
import ProductCard from '@/components/ProductCard'
import { useLang } from '@/contexts/LanguageContext'
import { COLLECTIONS, Collection } from '@/lib/collections'
import { Product } from '@/lib/types'

const ICONS = {
  'specialty-coffee': Coffee,
  'coffee-beans': Bean,
  'chocolate-by-weight': Candy,
  'dried-fruit': Citrus,
  'oud-incense': Flame,
  'boxed-chocolate': Gift,
  'bulk-packs': Package,
} as const

export default function CollectionClient({
  collection,
  products,
}: {
  collection: Collection
  products: Product[]
}) {
  const { t, dir } = useLang()
  const Icon = ICONS[collection.slug]
  const index = COLLECTIONS.findIndex((item) => item.slug === collection.slug)
  const previous = COLLECTIONS[(index - 1 + COLLECTIONS.length) % COLLECTIONS.length]
  const next = COLLECTIONS[(index + 1) % COLLECTIONS.length]

  return (
    <main className="min-h-screen bg-cream pt-24" dir={dir}>
      <section className="relative overflow-hidden bg-charcoal py-14 sm:py-16 md:py-20">
        <GeometricPattern className="absolute inset-0 h-full w-full text-sand opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-charcoal/70" />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-6">
          <div className="relative mb-5 flex size-20 items-center justify-center rounded-full border border-sand/40 bg-cream/[0.04] sm:mb-7 sm:size-24 md:size-28">
            <span className="absolute inset-2 rounded-full border border-dashed border-sand/25" />
            <Icon size={34} strokeWidth={1.2} className="relative text-sand sm:size-9 md:size-10" />
          </div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-sand sm:mb-4 sm:text-xs sm:tracking-[0.45em]">
            {t('مجموعات دوحة روستري', 'Doha Roastery Collections')}
          </p>
          <h1 className="mb-4 text-3xl font-light leading-tight text-cream sm:mb-5 sm:text-4xl md:text-6xl">
            {t(collection.ar, collection.en)}
          </h1>
          <p className="max-w-2xl text-sm font-light leading-7 text-cream/60 sm:leading-8 md:text-base">
            {t(collection.descriptionAr, collection.descriptionEn)}
          </p>
        </div>
      </section>

      <nav className="border-b border-sand/20 bg-cream-dark" aria-label={t('فئات المنتجات', 'Product categories')}>
        <div className="mx-auto flex max-w-7xl snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-3 sm:px-6 sm:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COLLECTIONS.map((item) => (
            <Link
              key={item.slug}
              href={`/collections/${item.slug}`}
              className={`shrink-0 snap-start whitespace-nowrap border px-3 py-2 text-[10px] uppercase tracking-widest transition-colors sm:px-4 ${
                item.slug === collection.slug
                  ? 'border-charcoal bg-charcoal text-cream'
                  : 'border-sand/30 text-charcoal hover:border-charcoal'
              }`}
            >
              {t(item.ar, item.en)}
            </Link>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end sm:gap-6">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.4em] text-sand">{t('اكتشف', 'Discover')}</p>
            <h2 className="text-3xl font-light text-charcoal">{t(collection.ar, collection.en)}</h2>
          </div>
          <Link href="/products" className="border-b border-charcoal text-xs uppercase tracking-widest text-charcoal hover:border-sand hover:text-sand">
            {t('كل المنتجات', 'All Products')}
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="border border-sand/20 bg-white px-5 py-14 text-center sm:px-6 sm:py-20">
            <Icon size={34} strokeWidth={1.2} className="mx-auto mb-5 text-sand/60" />
            <p className="mb-3 text-lg font-light text-charcoal">
              {t('ستتوفر منتجات هذه الفئة قريبًا', 'Products in this collection are coming soon')}
            </p>
            <p className="mx-auto mb-8 max-w-lg text-sm leading-7 text-charcoal/50">
              {t('يمكنك الآن استكشاف جميع منتجات دوحة روستري المتاحة.', 'Explore all currently available Doha Roastery products in the meantime.')}
            </p>
            <Link href="/products" className="inline-block bg-charcoal px-7 py-3 text-xs uppercase tracking-widest text-cream hover:bg-charcoal-light">
              {t('عرض كل المنتجات', 'View All Products')}
            </Link>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-sand/20 pt-8 sm:mt-16 sm:grid-cols-2 sm:gap-4">
          <Link href={`/collections/${previous.slug}`} className="group flex items-center gap-3 text-start text-charcoal">
            {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            <span>
              <span className="block text-[10px] uppercase tracking-widest text-sand">{t('السابق', 'Previous')}</span>
              <span className="text-sm group-hover:text-sand">{t(previous.ar, previous.en)}</span>
            </span>
          </Link>
          <Link href={`/collections/${next.slug}`} className="group flex items-center justify-start gap-3 text-start text-charcoal sm:justify-end sm:text-end">
            <span>
              <span className="block text-[10px] uppercase tracking-widest text-sand">{t('التالي', 'Next')}</span>
              <span className="text-sm group-hover:text-sand">{t(next.ar, next.en)}</span>
            </span>
            {dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </section>
    </main>
  )
}
