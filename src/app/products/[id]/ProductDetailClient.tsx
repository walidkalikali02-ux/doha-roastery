'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Minus, Plus, ChevronRight, Check } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/lib/types'
import ProductCard from '@/components/ProductCard'
import GeometricPattern from '@/components/GeometricPattern'

interface Props {
  product: Product
  related: Product[]
}

export default function ProductDetailClient({ product, related }: Props) {
  const { t, dir } = useLang()
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const isOutOfStock = !product.in_stock || product.quantity === 0
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
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
        <span className="text-charcoal truncate max-w-[160px]">{product.name}</span>
      </div>

      {/* Product section */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-12 lg:gap-20">

        {/* Image panel */}
        <div className="relative aspect-square bg-cream-dark overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GeometricPattern className="absolute inset-0 w-full h-full text-sand opacity-30" />
              <span className="text-8xl opacity-20 relative z-10">☕</span>
            </div>
          )}

          {/* Badges */}
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
        <div className="flex flex-col justify-center">
          {/* Category */}
          {product.category && (
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-3">
              {product.category}
            </p>
          )}

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-light text-charcoal leading-tight mb-4">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-light text-charcoal">
              {product.price.toFixed(2)}
              <span className="text-base text-sand ms-1">{t('ر.ق', 'QAR')}</span>
            </span>
            {hasDiscount && (
              <span className="text-lg line-through text-sand/60">
                {product.compare_at_price!.toFixed(2)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-sand/20 mb-6" />

          {/* Description */}
          {product.description && (
            <p className="text-charcoal/60 leading-relaxed mb-8 text-sm">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {product.tags.map((tag) => (
                <span key={tag} className="text-[10px] tracking-widest uppercase border border-sand/40 text-sand px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stock indicator */}
          {!isOutOfStock && product.quantity <= product.low_stock_threshold && (
            <p className="text-xs text-gold tracking-wide mb-4">
              ⚠ {t(`تبقّى ${product.quantity} فقط`, `Only ${product.quantity} left in stock`)}
            </p>
          )}

          {/* Quantity + Add to cart */}
          {!isOutOfStock ? (
            <div className="flex items-center gap-4 flex-wrap">
              {/* Qty selector */}
              <div className="flex items-center border border-sand/40">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2.5 text-charcoal hover:text-sand transition-colors"
                >
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="px-4 py-2.5 text-sm text-charcoal min-w-[40px] text-center border-x border-sand/40">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.quantity, qty + 1))}
                  className="px-3 py-2.5 text-charcoal hover:text-sand transition-colors"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 text-sm tracking-widest uppercase font-medium transition-all duration-300 ${
                  added
                    ? 'bg-green-700 text-cream'
                    : 'bg-charcoal text-cream hover:bg-sand hover:text-charcoal'
                }`}
              >
                {added ? (
                  <><Check size={16} strokeWidth={2} /> {t('أُضيف!', 'Added!')}</>
                ) : (
                  <><ShoppingBag size={16} strokeWidth={1.5} /> {t('أضف إلى السلة', 'Add to Cart')}</>
                )}
              </button>
            </div>
          ) : (
            <div className="py-3 px-6 bg-cream-dark text-center text-xs tracking-widest uppercase text-charcoal/40 border border-sand/20">
              {t('غير متوفر حالياً', 'Currently Unavailable')}
            </div>
          )}

          {/* Proceed to checkout shortcut */}
          {added && (
            <Link href="/cart" className="mt-4 text-center text-xs tracking-widest uppercase text-sand underline underline-offset-4 hover:text-gold transition-colors">
              {t('عرض السلة والدفع ←', 'View Cart & Checkout →')}
            </Link>
          )}

          {/* Meta info */}
          <div className="mt-8 pt-6 border-t border-sand/20 grid grid-cols-2 gap-4 text-xs">
            {product.sku && (
              <div>
                <span className="tracking-widest uppercase text-charcoal/40">{t('الرمز', 'SKU')}: </span>
                <span className="text-charcoal">{product.sku}</span>
              </div>
            )}
            <div>
              <span className="tracking-widest uppercase text-charcoal/40">{t('الحالة', 'Status')}: </span>
              <span className={product.in_stock ? 'text-green-700' : 'text-red-500'}>
                {product.in_stock ? t('متوفر', 'In Stock') : t('نفد', 'Out of Stock')}
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
                <Link key={p.id} href={`/products/${p.id}`}>
                  <ProductCard product={p} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
