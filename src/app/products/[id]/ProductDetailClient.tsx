'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Minus, Plus, ChevronRight, Check } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import GeometricPattern from '@/components/GeometricPattern'

export interface WeightVariant {
  id: string
  weight: string
  price: number
  in_stock: boolean
  quantity: number
}

interface Props {
  product: Product
  weightVariants: WeightVariant[]
  related: Product[]
}

const WEIGHT_ORDER = ['100g', '250g', '500g', '1kg']

const GRIND_OPTIONS = [
  { value: 'whole-bean',   ar: 'حبوب كاملة', en: 'Whole Bean' },
  { value: 'espresso',     ar: 'إسبريسو',    en: 'Espresso' },
  { value: 'filter',       ar: 'فلتر',        en: 'Filter' },
  { value: 'moka',         ar: 'موكا',        en: 'Moka Pot' },
  { value: 'french-press', ar: 'فرنش برس',   en: 'French Press' },
]

export default function ProductDetailClient({ product, weightVariants, related }: Props) {
  const { t, dir, lang } = useLang()
  const { addItem } = useCart()

  const isWeightProduct = weightVariants.length > 0
  const isCoffeeBeans   = product.category === 'Coffee Beans'

  const [selectedVariantId, setSelectedVariantId] = useState(product.id)
  const [grind, setGrind] = useState('whole-bean')
  const [notes, setNotes] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const selectedVariant = isWeightProduct
    ? (weightVariants.find((v) => v.id === selectedVariantId) ?? weightVariants[0])
    : null

  const displayPrice    = selectedVariant ? selectedVariant.price    : product.price
  const displayInStock  = selectedVariant
    ? selectedVariant.in_stock && selectedVariant.quantity > 0
    : product.in_stock && product.quantity > 0
  const displayQuantity = selectedVariant ? selectedVariant.quantity : product.quantity

  const isOutOfStock = !displayInStock
  const hasDiscount  = !isWeightProduct && !!product.compare_at_price && product.compare_at_price > product.price
  const discountPct  = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  const isWeightBased = weightVariants.some(v => /^\d+(g|kg)$/i.test(v.weight))

  const orderedVariants = [...weightVariants].sort(
    (a, b) => WEIGHT_ORDER.indexOf(a.weight) - WEIGHT_ORDER.indexOf(b.weight)
  )

  function handleAdd() {
    const itemId     = selectedVariant ? selectedVariant.id       : product.id
    const itemWeight = selectedVariant ? selectedVariant.weight   : (product.weight ?? '')
    const itemPrice  = selectedVariant ? selectedVariant.price    : product.price

    for (let i = 0; i < qty; i++) {
      addItem({
        id: itemId,
        name: product.name,
        weight: itemWeight,
        grind: isCoffeeBeans ? grind : '',
        notes,
        price: itemPrice,
        image_url: product.image_url,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <main className="pt-16 min-h-screen" dir={dir}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-xs text-charcoal/40">
        <Link href="/" className="hover:text-sand transition-colors">{t('الرئيسية', 'Home')}</Link>
        <ChevronRight size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <Link href="/products" className="hover:text-sand transition-colors">{t('المنتجات', 'Products')}</Link>
        <ChevronRight size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span className="text-charcoal truncate max-w-[200px]">
          {lang === 'ar' && product.name_ar ? product.name_ar : product.name}
        </span>
      </div>

      {/* Product section */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-12 lg:gap-20">

        {/* Image */}
        <div className="relative aspect-square bg-cream-dark overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={lang === 'ar' && product.name_ar ? product.name_ar : product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-30" />
              <span className="text-8xl opacity-20 relative z-10">☕</span>
            </div>
          )}
          <div className="absolute top-4 start-4 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-terracotta text-cream text-[10px] tracking-widest uppercase px-3 py-1">
                -{discountPct}% {t('خصم', 'OFF')}
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-charcoal text-cream text-[10px] tracking-widest uppercase px-3 py-1">
                {t('نفد', 'Sold Out')}
              </span>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-col">
          {product.category && (
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{product.category}</p>
          )}

          <h1 className="text-3xl md:text-4xl font-light text-charcoal leading-tight mb-2">
            {lang === 'ar' && product.name_ar ? product.name_ar : product.name}
          </h1>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map((tag) => (
                <span key={tag} className="text-[10px] tracking-widest uppercase border border-sand/40 text-sand px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {(lang === 'ar' ? (product.description_ar || product.description) : product.description) && (
            <p className="text-charcoal/60 leading-relaxed mb-5 text-sm">
              {lang === 'ar' ? (product.description_ar || product.description) : product.description}
            </p>
          )}

          <div className="h-px bg-sand/20 mb-5" />

          {/* Weight selector */}
          {isWeightProduct && orderedVariants.length > 1 && (
            <div className="mb-5">
              <p className="text-[10px] tracking-widest uppercase text-charcoal/50 mb-2">
                {isWeightBased ? t('الوزن', 'Weight') : t('النوع', 'Type')}
              </p>
              <div className="flex flex-wrap gap-2">
                {orderedVariants.map((v) => {
                  const unavailable = !v.in_stock || v.quantity === 0
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariantId(v.id); setQty(1) }}
                      disabled={unavailable}
                      className={`flex items-center gap-2 px-3 py-2 text-xs border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        selectedVariantId === v.id
                          ? 'bg-charcoal text-cream border-charcoal'
                          : 'border-sand/40 text-charcoal hover:border-charcoal'
                      }`}
                    >
                      <span className="font-medium">{v.weight}</span>
                      <span className="opacity-60">{v.price.toFixed(0)} {t('ر.ق', 'QAR')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-light text-charcoal">
              {displayPrice.toFixed(2)}
              <span className="text-base text-sand ms-1">{t('ر.ق', 'QAR')}</span>
            </span>
            {hasDiscount && (
              <span className="text-lg line-through text-sand/60">
                {product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Grind selector — Coffee Beans only */}
          {isCoffeeBeans && (
            <div className="mb-5">
              <p className="text-[10px] tracking-widest uppercase text-charcoal/50 mb-2">
                {t('درجة الطحن', 'Grind')}
              </p>
              <div className="flex flex-wrap gap-2">
                {GRIND_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGrind(opt.value)}
                    className={`px-3 py-1.5 text-xs border transition-all ${
                      grind === opt.value
                        ? 'bg-charcoal text-cream border-charcoal'
                        : 'border-sand/40 text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {t(opt.ar, opt.en)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-5">
            <label className="block text-[10px] tracking-widest uppercase text-charcoal/50 mb-2">
              {t('ملاحظات', 'Notes')}
              <span className="ms-2 normal-case font-normal text-charcoal/30">
                {t('(اختياري)', '(optional)')}
              </span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                'أي طلب خاص — نكهة، نوع التحميص، تفضيلات...',
                'Any special request — flavor, roast level, preferences...'
              )}
              className="w-full border border-sand/30 px-3 py-2.5 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal resize-none placeholder-charcoal/30 leading-relaxed"
            />
          </div>

          {/* Stock warning */}
          {!isOutOfStock && displayQuantity <= product.low_stock_threshold && (
            <p className="text-xs text-gold tracking-wide mb-4">
              ⚠ {t(`تبقّى ${displayQuantity} فقط`, `Only ${displayQuantity} left in stock`)}
            </p>
          )}

          {/* Qty + Add */}
          {!isOutOfStock ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border border-sand/40">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 text-charcoal hover:text-sand transition-colors">
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="px-4 py-2.5 text-sm text-charcoal min-w-[40px] text-center border-x border-sand/40">{qty}</span>
                <button onClick={() => setQty(Math.min(displayQuantity, qty + 1))} className="px-3 py-2.5 text-charcoal hover:text-sand transition-colors">
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 text-sm tracking-widest uppercase font-medium transition-all duration-300 ${
                  added ? 'bg-green-700 text-cream' : 'bg-charcoal text-cream hover:bg-sand hover:text-charcoal'
                }`}
              >
                {added
                  ? <><Check size={16} strokeWidth={2} /> {t('أُضيف!', 'Added!')}</>
                  : <><ShoppingBag size={16} strokeWidth={1.5} /> {t('أضف إلى السلة', 'Add to Cart')}</>
                }
              </button>
            </div>
          ) : (
            <div className="py-3 px-6 bg-cream-dark text-center text-xs tracking-widest uppercase text-charcoal/40 border border-sand/20">
              {t('غير متوفر حالياً', 'Currently Unavailable')}
            </div>
          )}

          {added && (
            <Link href="/cart" className="mt-3 text-center text-xs tracking-widest uppercase text-sand underline underline-offset-4 hover:text-gold transition-colors">
              {t('عرض السلة والدفع ←', 'View Cart & Checkout →')}
            </Link>
          )}

          {/* Meta */}
          <div className="mt-6 pt-5 border-t border-sand/20 grid grid-cols-2 gap-4 text-xs">
            {product.sku && (
              <div>
                <span className="tracking-widest uppercase text-charcoal/40">{t('الرمز', 'SKU')}: </span>
                <span className="text-charcoal">{product.sku}</span>
              </div>
            )}
            <div>
              <span className="tracking-widest uppercase text-charcoal/40">{t('الحالة', 'Status')}: </span>
              <span className={displayInStock ? 'text-green-700' : 'text-red-500'}>
                {displayInStock ? t('متوفر', 'In Stock') : t('نفد', 'Out of Stock')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="bg-cream-dark py-16">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{t('اكتشف أيضاً', 'You May Also Like')}</p>
            <h2 className="text-3xl font-light text-charcoal mb-10">{t('منتجات مشابهة', 'Related Products')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
