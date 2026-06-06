'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'

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
}

const WEIGHT_ORDER = ['100g', '250g', '500g', '1kg']

export default function ProductGroupCard({ group }: { group: ProductGroup }) {
  const { t, lang } = useLang()
  const { addItem } = useCart()

  const defaultVariant =
    group.variants.find((v) => v.weight === '250g' && v.in_stock && v.quantity > 0) ??
    group.variants.find((v) => v.in_stock && v.quantity > 0) ??
    group.variants[0]

  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? group.variants[0]?.id)

  const selected = group.variants.find((v) => v.id === selectedId) ?? group.variants[0]
  const isOutOfStock = !selected.in_stock || selected.quantity === 0

  function handleAdd() {
    addItem({
      id: selected.id,
      name: group.baseName,
      weight: selected.weight,
      grind: 'whole-bean',
      notes: '',
      price: selected.price,
      image_url: group.image_url,
    })
  }

  const isWeightBased = group.variants.some(v => /^\d+(g|kg)$/i.test(v.weight))

  const orderedWeights = isWeightBased
    ? WEIGHT_ORDER.filter((w) => group.variants.some((v) => v.weight === w))
    : group.variants.map(v => v.weight)

  return (
    <div className="group bg-white border border-sand/20 hover:border-sand/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image */}
      <Link href={`/products/${selected.id}`}>
        <div className="relative aspect-square bg-cream-dark overflow-hidden">
          {group.image_url ? (
            <img
              src={group.image_url}
              alt={lang === 'ar' && group.baseName_ar ? group.baseName_ar : group.baseName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">☕</span>
            </div>
          )}
          {isOutOfStock && (
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
          <p className="text-[10px] tracking-widest uppercase text-sand mb-1">{group.category}</p>
        )}
        <Link href={`/products/${selected.id}`}>
          <h3 className="text-sm font-medium text-charcoal leading-snug mb-3 line-clamp-2 hover:text-sand transition-colors">
            {lang === 'ar' && group.baseName_ar ? group.baseName_ar : group.baseName}
          </h3>
        </Link>

        {/* Variant selector */}
        {orderedWeights.length > 1 && (
          <div className="mb-3">
            {!isWeightBased && (
              <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-1.5">
                {t('النوع', 'Type')}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {orderedWeights.map((weight) => {
                const variant = group.variants.find((v) => v.weight === weight)!
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
                    {weight}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Price + Add */}
        <div className="flex items-center justify-between">
          <span className="text-base font-light text-charcoal">
            {selected.price.toFixed(2)}{' '}
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
    </div>
  )
}
