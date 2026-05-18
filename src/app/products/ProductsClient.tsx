'use client'
import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import ProductCard from '@/components/ProductCard'
import GeometricPattern from '@/components/GeometricPattern'
import { Product } from '@/lib/types'

interface Props {
  products: Product[]
  categories: string[]
}

export default function ProductsClient({ products, categories }: Props) {
  const { t, dir } = useLang()
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

  const filtered = useMemo(() => {
    let list = [...products]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (selectedCat) list = list.filter((p) => p.category === selectedCat)
    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [products, search, selectedCat, sort])

  return (
    <main className="pt-16 min-h-screen" dir={dir}>
      {/* Page hero */}
      <section className="relative bg-charcoal py-20 overflow-hidden">
        <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <p className="text-sand text-xs tracking-[0.5em] uppercase mb-4">
            {t('تسوّق', 'Browse')}
          </p>
          <h1 className="text-5xl md:text-6xl font-light text-cream">
            {t('منتجاتنا', 'Our Products')}
          </h1>
        </div>
      </section>

      {/* Filters bar */}
      <div className="sticky top-16 z-30 bg-cream border-b border-sand/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-sand" />
            <input
              type="text"
              placeholder={t('ابحث عن منتج...', 'Search products...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-8 pe-4 py-2 text-sm border border-sand/30 bg-transparent text-charcoal placeholder-sand focus:outline-none focus:border-charcoal"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCat(null)}
              className={`text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                !selectedCat
                  ? 'bg-charcoal text-cream border-charcoal'
                  : 'border-sand/40 text-charcoal hover:border-charcoal'
              }`}
            >
              {t('الكل', 'All')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                className={`text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                  selectedCat === cat
                    ? 'bg-charcoal text-cream border-charcoal'
                    : 'border-sand/40 text-charcoal hover:border-charcoal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="text-[10px] tracking-widest uppercase border border-sand/30 bg-transparent py-1.5 px-3 text-charcoal focus:outline-none focus:border-charcoal cursor-pointer"
          >
            <option value="newest">{t('الأحدث', 'Newest')}</option>
            <option value="price_asc">{t('السعر: من الأقل', 'Price: Low to High')}</option>
            <option value="price_desc">{t('السعر: من الأعلى', 'Price: High to Low')}</option>
          </select>
        </div>
      </div>

      {/* Products grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-xs text-sand tracking-widest mb-8">
          {filtered.length} {t('منتج', 'products')}
        </p>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <p className="text-sand tracking-widest text-sm">
              {t('لا توجد منتجات مطابقة', 'No matching products')}
            </p>
            {(search || selectedCat) && (
              <button
                onClick={() => { setSearch(''); setSelectedCat(null) }}
                className="mt-4 text-xs tracking-widest uppercase border-b border-charcoal text-charcoal hover:text-sand hover:border-sand transition-colors"
              >
                {t('مسح الفلاتر', 'Clear Filters')}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
