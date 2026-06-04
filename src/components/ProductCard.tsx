'use client'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/lib/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { t, lang } = useLang()
  const { addItem } = useCart()

  const isLowStock = product.quantity > 0 && product.quantity <= product.low_stock_threshold
  const isOutOfStock = !product.in_stock || product.quantity === 0

  return (
    <div className="group bg-white border border-sand/20 hover:border-sand/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image area — links to detail */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-cream-dark overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={lang === 'ar' && product.name_ar ? product.name_ar : product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">☕</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 start-3 flex flex-col gap-1">
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="bg-terracotta text-cream text-[10px] tracking-widest uppercase px-2 py-0.5">
                {t('خصم', 'Sale')}
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-charcoal text-cream text-[10px] tracking-widest uppercase px-2 py-0.5">
                {t('نفد', 'Sold Out')}
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="bg-gold text-charcoal text-[10px] tracking-widest uppercase px-2 py-0.5">
                {t('آخر الكميات', 'Low Stock')}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-[10px] tracking-widest uppercase text-sand mb-1">
            {product.category}
          </p>
        )}
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium text-charcoal leading-snug mb-3 line-clamp-2 hover:text-sand transition-colors">
            {lang === 'ar' && product.name_ar ? product.name_ar : product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-light text-charcoal">
              {product.price.toFixed(2)} {t('ر.ق', 'QAR')}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs line-through text-sand">
                {product.compare_at_price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            disabled={isOutOfStock}
            onClick={() => addItem({ id: product.id, name: product.name, weight: '', grind: '', notes: '', price: product.price, image_url: product.image_url })}
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
