'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { QTY_AR, formatGroupedProductTitle, localizeCategory, localizeOrigin, localizeWeight } from '@/lib/display-text'

export interface WeightVariant {
  id: string
  weight: string
  price: number
  in_stock: boolean
  quantity: number
}

export interface ProductGroup {
  baseName: string
  baseName_ar: string | null
  category: string | null
  image_url: string | null
  variants: WeightVariant[]
  origin?: string | null
}

const WEIGHT_ORDER = ['100g', '250g', '500g', '1kg']
const COMPOUND_SEP = '|'
const QTY_ORDER = ['Single Serve', '1 Box', '5 Bags', '10 Bags', 'Box of 8', '5 Boxes']

export default function ProductGroupCard({ group }: { group: ProductGroup }) {
  const { t, lang } = useLang()
  const { addItem } = useCart()

  // Compound-by-origin: group.origin is set → one origin per card (products listing)
  const isCompoundByOrigin = !!group.origin
  // Multi-origin compound: no origin set but variants have compound weights (homepage)
  const isCompoundMulti = !group.origin && group.variants.some((v) => v.weight.includes(COMPOUND_SEP))
  const isWeightBased = !isCompoundByOrigin && !isCompoundMulti &&
    group.variants.some((v) => /^\d+(g|kg)$/i.test(v.weight))

  const orderedWeights = isWeightBased
    ? WEIGHT_ORDER.filter((w) => group.variants.some((v) => v.weight === w))
    : (isCompoundByOrigin || isCompoundMulti) ? [] : group.variants.map((v) => v.weight)

  // Sort compound-by-origin variants by quantity order (cheapest first)
  const orderedCompoundVariants = isCompoundByOrigin
    ? [...group.variants].sort((a, b) => {
        const qa = a.weight.split(COMPOUND_SEP)[1]
        const qb = b.weight.split(COMPOUND_SEP)[1]
        return QTY_ORDER.indexOf(qa) - QTY_ORDER.indexOf(qb)
      })
    : group.variants

  const defaultVariant = group.variants.find((v) => v.in_stock && v.quantity > 0) ?? group.variants[0]
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? group.variants[0]?.id)

  const selected = group.variants.find((v) => v.id === selectedId) ?? group.variants[0]
  const isOutOfStock = !selected.in_stock || selected.quantity === 0

  // Canonical link
  const detailId = isCompoundByOrigin
    ? group.variants[group.variants.length - 1].id
    : group.variants[0].id

  // For multi-origin compound (homepage): unique origins for display
  const multiOrigins = isCompoundMulti
    ? Array.from(new Set(group.variants.map((v) => v.weight.split(COMPOUND_SEP)[0])))
    : []

  const displayTitle = formatGroupedProductTitle({
    baseName: group.baseName,
    baseNameAr: group.baseName_ar,
    origin: group.origin,
    lang,
  })

  function handleAdd() {
    addItem({
      id:        selected.id,
      name:      group.baseName,
      nameAr:    group.baseName_ar,
      weight:    selected.weight,
      grind:     'whole-bean',
      notes:     '',
      price:     selected.price,
      image_url: group.image_url,
    })
  }

  return (
    <div className="group bg-white border border-sand/20 hover:border-sand/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">

      {/* Image */}
      <Link href={`/products/${detailId}`}>
        <div className="relative aspect-square bg-cream-dark overflow-hidden">
          {group.image_url ? (
            <img
              src={group.image_url}
              alt={displayTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">☕</span>
            </div>
          )}
          {isOutOfStock && !isCompoundByOrigin && !isCompoundMulti && (
            <div className="absolute top-3 start-3">
              <span className="bg-charcoal text-cream text-[10px] tracking-widest uppercase px-2 py-0.5">
                {t('نفد', 'Sold Out')}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {group.category && (
          <p className="text-[10px] tracking-widest uppercase text-sand mb-1">{localizeCategory(group.category, lang)}</p>
        )}

        <Link href={`/products/${detailId}`}>
          <h3 className="text-sm font-medium text-charcoal leading-snug mb-1 hover:text-sand transition-colors line-clamp-2">
            {displayTitle}
          </h3>
        </Link>

        {/* Show base name as subtitle when compound-by-origin */}
        {isCompoundByOrigin && (
          <p className="text-[10px] text-charcoal/40 mb-3 leading-relaxed line-clamp-1">{localizeWeight(selected.weight, lang)}</p>
        )}

        {/* Multi-origin compound (homepage): origin tags + "Choose" link */}
        {isCompoundMulti && (
          <div>
            <p className="text-[10px] text-charcoal/40 mb-3 leading-relaxed">
              {multiOrigins.map((o) => localizeOrigin(o, lang)).join(' · ')}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-charcoal/40">{t('من', 'from')} </span>
                <span className="text-base font-light text-charcoal">
                  <bdi dir="ltr">{Math.min(...group.variants.map((v) => v.price)).toFixed(0)}</bdi>{' '}
                  <span className="text-sm text-sand">{t('ر.ق', 'QAR')}</span>
                </span>
              </div>
              <Link
                href={`/products/${detailId}`}
                className="text-[10px] tracking-widest uppercase border border-charcoal text-charcoal px-3 py-1.5
                           hover:bg-charcoal hover:text-cream transition-all duration-200"
              >
                {t('عرض الخيارات', 'View Options')}
              </Link>
            </div>
          </div>
        )}

        {/* Compound-by-origin: quantity selector + add to cart */}
        {isCompoundByOrigin && (
          <div>
            {orderedCompoundVariants.length > 1 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {orderedCompoundVariants.map((v) => {
                  const qty = v.weight.split(COMPOUND_SEP)[1]
                  const unavailable = !v.in_stock || v.quantity === 0
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedId(v.id)}
                      disabled={unavailable}
                      className={`text-[10px] tracking-wide px-2 py-1 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                        selectedId === v.id
                          ? 'bg-charcoal text-cream border-charcoal'
                          : 'border-sand/40 text-charcoal hover:border-charcoal'
                      }`}
                    >
                      {lang === 'ar' ? (QTY_AR[qty] ?? qty) : qty}
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-base font-light text-charcoal">
                <bdi dir="ltr">{selected.price.toFixed(2)}</bdi>{' '}
                <span className="text-sm text-sand">{t('ر.ق', 'QAR')}</span>
              </span>
              <button
                disabled={isOutOfStock}
                onClick={handleAdd}
                className="text-[10px] tracking-widest uppercase border border-charcoal text-charcoal px-3 py-1.5
                           hover:bg-charcoal hover:text-cream transition-all duration-200
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {t('أضف', 'Add')}
              </button>
            </div>
          </div>
        )}

        {/* Simple weight/type selector */}
        {!isCompoundByOrigin && !isCompoundMulti && orderedWeights.length > 1 && (
          <div className="mb-3">
            {!isWeightBased && (
              <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-1.5">
                {t('النوع', 'Type')}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {orderedWeights.map((weight) => {
                const variant     = group.variants.find((v) => v.weight === weight)!
                const unavailable = !variant.in_stock || variant.quantity === 0
                return (
                  <button
                    key={weight}
                    onClick={() => setSelectedId(variant.id)}
                    disabled={unavailable}
                    className={`text-[10px] tracking-wide px-2 py-1 border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      selectedId === variant.id
                        ? 'bg-charcoal text-cream border-charcoal'
                        : 'border-sand/40 text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {localizeWeight(weight, lang)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Price + Add — simple (non-compound) only */}
        {!isCompoundByOrigin && !isCompoundMulti && (
          <div className="flex items-center justify-between">
            <span className="text-base font-light text-charcoal">
                <bdi dir="ltr">{selected.price.toFixed(2)}</bdi>{' '}
              <span className="text-sm text-sand">{t('ر.ق', 'QAR')}</span>
            </span>
            <button
              disabled={isOutOfStock}
              onClick={handleAdd}
              className="text-[10px] tracking-widest uppercase border border-charcoal text-charcoal px-3 py-1.5
                         hover:bg-charcoal hover:text-cream transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t('أضف', 'Add')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
