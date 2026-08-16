'use client'

import { Droplets } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import ProductCard from '@/components/ProductCard'
import GeometricPattern from '@/components/GeometricPattern'
import { Product } from '@/lib/types'

export default function HoneyClient({ products }: { products: Product[] }) {
  const { t, dir } = useLang()

  return (
    <main className="pt-24 min-h-screen" dir={dir}>
      <section className="relative bg-charcoal py-20 overflow-hidden">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <p className="text-sand text-xs tracking-[0.5em] uppercase mb-4">
            {t('اختيارات طبيعية', 'Natural Selection')}
          </p>
          <h1 className="text-5xl md:text-6xl font-light text-cream">
            {t('العسل', 'Honey')}
          </h1>
          <p className="text-cream/50 mt-4 max-w-md mx-auto text-sm leading-relaxed">
            {t(
              'اكتشف منتجات العسل المختارة بعناية، مع توصيل داخل قطر.',
              'Discover carefully selected honey products with delivery across Qatar.'
            )}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        {products.length > 0 ? (
          <>
            <p className="text-xs text-sand tracking-widest mb-8">
              {products.length} {t('منتج', 'products')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-32 flex flex-col items-center gap-6">
            <Droplets size={40} strokeWidth={1} className="text-sand/40" />
            <div>
              <p className="text-charcoal/50 tracking-widest text-sm mb-2">
                {t('قريبًا', 'Coming Soon')}
              </p>
              <p className="text-xs text-charcoal/30 tracking-wide">
                {t('نعمل على إضافة منتجات العسل قريبًا.', 'We are adding honey products soon.')}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
