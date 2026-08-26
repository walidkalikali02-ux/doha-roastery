'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Minus, Plus, ChevronRight, Check } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import GeometricPattern from '@/components/GeometricPattern'
import { buildProductDescription, normalizeArabicDescription, QTY_AR, formatProductTitle, localizeCategory, localizeOrigin, localizeWeight } from '@/lib/display-text'

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
const COMPOUND_SEP = '|'
const QTY_ORDER = ['Single Serve', '1 Box', '5 Bags', '10 Bags', 'Box of 8', '5 Boxes']

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
  // Turkish coffee is always pre-ground, so no grind selector
  const isTurkishCoffee = /turkish/i.test(product.name) || /تركي/.test(product.name_ar ?? '')
  const isCoffeeBeans   = product.category === 'Coffee Beans' && !isTurkishCoffee

  const isCompound    = weightVariants.some((v) => v.weight.includes(COMPOUND_SEP))
  const isWeightBased = !isCompound && weightVariants.some((v) => /^\d+(g|kg)$/i.test(v.weight))

  // For compound pages, all variants share the same origin (per-origin pages)
  const compoundOrigin = isCompound ? weightVariants[0].weight.split(COMPOUND_SEP)[0] : null

  const defaultCompoundVariant = isCompound
    ? (weightVariants.find((v) => v.in_stock && v.quantity > 0) ?? weightVariants[0])
    : null

  const [selectedVariantId,   setSelectedVariantId]   = useState(product.id)
  const [selectedCompoundId,  setSelectedCompoundId]  = useState(defaultCompoundVariant?.id ?? '')
  const [grind,  setGrind]  = useState('whole-bean')
  const [notes,  setNotes]  = useState('')
  const [qty,    setQty]    = useState(1)
  const [added,  setAdded]  = useState(false)

  const selectedVariant = isCompound
    ? (weightVariants.find((v) => v.id === selectedCompoundId) ?? weightVariants[0])
    : isWeightProduct
      ? (weightVariants.find((v) => v.id === selectedVariantId) ?? weightVariants[0])
      : null
  const productTitle = formatProductTitle({
    name: product.name,
    nameAr: product.name_ar,
    weight: selectedVariant?.weight ?? product.weight,
    lang,
  })
  const displayDescription =
    lang === 'ar'
      ? buildProductDescription({
          name: product.name,
          nameAr: product.name_ar,
          category: product.category,
          weight: selectedVariant?.weight ?? product.weight,
          lang: 'ar',
          sourceDescription: product.description,
          baseDescription: product.description_ar
            ? normalizeArabicDescription(product.description_ar, product.weight)
            : null,
        })
      : buildProductDescription({
          name: product.name,
          nameAr: product.name_ar,
          category: product.category,
          weight: selectedVariant?.weight ?? product.weight,
          sourceDescription: product.description,
          lang: 'en',
        })

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

  const orderedVariants = [...weightVariants].sort(
    (a, b) => WEIGHT_ORDER.indexOf(a.weight) - WEIGHT_ORDER.indexOf(b.weight)
  )

  function handleAdd() {
    const itemId     = selectedVariant ? selectedVariant.id     : product.id
    const itemWeight = selectedVariant ? selectedVariant.weight : (product.weight ?? '')
    const itemPrice  = selectedVariant ? selectedVariant.price  : product.price

    for (let i = 0; i < qty; i++) {
      addItem({
        id:        itemId,
        name:      product.name,
        nameAr:    product.name_ar,
        weight:    itemWeight,
        grind:     isCoffeeBeans ? grind : '',
        notes,
        price:     itemPrice,
        image_url: product.image_url,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <main className="pt-24 min-h-screen" dir={dir}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-xs text-charcoal/40">
        <Link href="/" className="hover:text-sand transition-colors">{t('الرئيسية', 'Home')}</Link>
        <ChevronRight size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <Link href="/products" className="hover:text-sand transition-colors">{t('المنتجات', 'Products')}</Link>
        <ChevronRight size={12} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span className="text-charcoal truncate max-w-[200px]">
          {productTitle}
        </span>
      </div>

      {/* Product section */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-12 lg:gap-20">

        {/* Image */}
        <div className="relative aspect-square bg-cream-dark overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={productTitle}
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
                <bdi dir="ltr">-{discountPct}%</bdi> {t('خصم', 'OFF')}
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
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">{localizeCategory(product.category, lang)}</p>
          )}

          {isCompound && (
            <p className="text-sm text-charcoal/50 mb-2">
              {t('المنشأ', 'Origin')}: {localizeOrigin(compoundOrigin, lang)}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-light text-charcoal leading-tight mb-2">
            {productTitle}
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

          {displayDescription && (
            <ProductDescription text={displayDescription} />
          )}

          <div className="h-px bg-sand/20 mb-5" />

          {/* Compound — quantity selector only (one page per origin) */}
          {isCompound && weightVariants.length > 1 && (
            <div className="mb-5">
              <p className="text-[10px] tracking-widest uppercase text-charcoal/50 mb-2">
                {t('الكمية', 'Quantity')}
              </p>
              <div className="flex flex-wrap gap-2">
                {[...weightVariants].sort((a, b) => {
                  const qa = a.weight.split(COMPOUND_SEP)[1]
                  const qb = b.weight.split(COMPOUND_SEP)[1]
                  return QTY_ORDER.indexOf(qa) - QTY_ORDER.indexOf(qb)
                }).map((v) => {
                  const qty         = v.weight.split(COMPOUND_SEP)[1]
                  const unavailable = !v.in_stock || v.quantity === 0
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedCompoundId(v.id); setQty(1) }}
                      disabled={unavailable}
                      className={`flex items-center gap-2 px-3 py-2 text-xs border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        selectedCompoundId === v.id
                          ? 'bg-charcoal text-cream border-charcoal'
                          : 'border-sand/40 text-charcoal hover:border-charcoal'
                      }`}
                    >
                      <span className="font-medium">{lang === 'ar' ? (QTY_AR[qty] ?? qty) : qty}</span>
                      <span className="opacity-60"><bdi dir="ltr">{v.price.toFixed(0)}</bdi> {t('ر.ق', 'QAR')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Simple weight/type selector */}
          {!isCompound && isWeightProduct && orderedVariants.length > 1 && (
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
                      <span className="font-medium">{localizeWeight(v.weight, lang)}</span>
                      <span className="opacity-60"><bdi dir="ltr">{v.price.toFixed(0)}</bdi> {t('ر.ق', 'QAR')}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-light text-charcoal">
              <bdi dir="ltr">{displayPrice.toFixed(2)}</bdi>
              <span className="text-base text-sand ms-1">{t('ر.ق', 'QAR')}</span>
            </span>
            {hasDiscount && (
              <span className="text-lg line-through text-sand/60">
                <bdi dir="ltr">{product.compare_at_price!.toFixed(2)}</bdi>
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
              ⚠ {t('تبقّى ', 'Only ')}<bdi dir="ltr">{displayQuantity}</bdi>{t(' فقط', ' left in stock')}
            </p>
          )}

          {/* Qty + Add */}
          {!isOutOfStock ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border border-sand/40">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 text-charcoal hover:text-sand transition-colors">
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="px-4 py-2.5 text-sm text-charcoal min-w-[40px] text-center border-x border-sand/40"><bdi dir="ltr">{qty}</bdi></span>
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

function ProductDescription({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="text-charcoal/60 leading-relaxed mb-5 text-sm space-y-5">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
        const heading = lines.length > 1 && /[:：]$/.test(lines[0]) ? lines[0] : null
        const contentLines = heading ? lines.slice(1) : lines
        const facts = contentLines.length > 1 && contentLines.every((line) => /^[^:：]{2,32}[:：]\s*.+$/.test(line))
        const bullets = contentLines.some((line) => /^[-*•]\s+/.test(line))

        if (facts) {
          return (
            <section key={blockIndex} className="border-s-2 border-sand/40 ps-4">
              {heading && <h3 className="text-xs font-medium tracking-wide text-charcoal mb-3">{heading}</h3>}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {contentLines.map((line) => {
                  const [label, ...valueParts] = line.split(/[:：]/)
                  return (
                    <div key={line} className="flex gap-2 text-xs">
                      <dt className="text-charcoal/45">{label.trim()}:</dt>
                      <dd className="text-charcoal/70">{valueParts.join(':').trim()}</dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          )
        }

        if (bullets) {
          return (
            <section key={blockIndex}>
              {heading && <h3 className="text-xs font-medium tracking-wide text-charcoal mb-2">{heading}</h3>}
              <ul className="space-y-1.5 list-disc ps-5">
                {contentLines.map((line) => <li key={line}>{line.replace(/^[-*•]\s+/, '')}</li>)}
              </ul>
            </section>
          )
        }

        return (
          <p key={blockIndex} className="whitespace-pre-line">
            {block}
          </p>
        )
      })}
    </div>
  )
}
