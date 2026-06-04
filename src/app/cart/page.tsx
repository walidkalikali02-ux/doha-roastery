'use client'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const GRIND_LABELS: Record<string, { ar: string; en: string }> = {
  'whole-bean':   { ar: 'حبوب كاملة', en: 'Whole Bean' },
  'espresso':     { ar: 'إسبريسو',    en: 'Espresso' },
  'filter':       { ar: 'فلتر',        en: 'Filter' },
  'moka':         { ar: 'موكا',        en: 'Moka Pot' },
  'french-press': { ar: 'فرنش برس',   en: 'French Press' },
}

export default function CartPage() {
  const { t, dir } = useLang()
  const { items, removeItem, updateQty, total, count } = useCart()

  const shipping = total >= 200 ? 0 : 15
  const grandTotal = total + shipping

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-cream" dir={dir}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Title */}
          <div className="mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-sand mb-2">{t('مراجعة', 'Review')}</p>
            <h1 className="text-4xl font-light text-charcoal">
              {t('سلة التسوق', 'Shopping Cart')}
              {count > 0 && <span className="text-sand text-2xl ms-3">({count})</span>}
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <ShoppingBag size={48} strokeWidth={1} className="text-sand mb-6" />
              <h2 className="text-2xl font-light text-charcoal mb-3">
                {t('السلة فارغة', 'Your cart is empty')}
              </h2>
              <p className="text-sm text-charcoal/50 mb-8">
                {t('أضف بعض المنتجات لتبدأ تسوقك', 'Add some products to start shopping')}
              </p>
              <Link href="/products">
                <span className="inline-block bg-charcoal text-cream px-8 py-3.5 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors">
                  {t('تسوّق الآن', 'Shop Now')}
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Items list */}
              <div className="lg:col-span-2 space-y-0 divide-y divide-sand/15 border-y border-sand/15">
                {items.map((item) => {
                  const grindLabel = item.grind ? GRIND_LABELS[item.grind] : null
                  return (
                    <div key={item.cartKey} className="flex gap-5 py-6">
                      {/* Thumbnail */}
                      <Link href={`/products/${item.id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 bg-cream-dark overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">☕</div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.id}`}>
                          <h3 className="text-sm font-medium text-charcoal hover:text-sand transition-colors line-clamp-2 mb-0.5">
                            {item.name}
                          </h3>
                        </Link>

                        {/* Weight + Grind tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.weight && (
                            <span className="text-[10px] tracking-widest uppercase border border-sand/40 text-sand px-2 py-0.5">
                              {item.weight}
                            </span>
                          )}
                          {grindLabel && (
                            <span className="text-[10px] tracking-widest uppercase border border-sand/40 text-sand px-2 py-0.5">
                              {t(grindLabel.ar, grindLabel.en)}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-xs text-charcoal/40 italic mb-2 line-clamp-1">
                            {item.notes}
                          </p>
                        )}

                        <p className="text-base font-light text-charcoal mb-3">
                          {item.price.toFixed(2)} <span className="text-sand text-sm">{t('ر.ق', 'QAR')}</span>
                        </p>

                        {/* Qty controls */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-sand/40">
                            <button
                              onClick={() => updateQty(item.cartKey, item.quantity - 1)}
                              className="px-2.5 py-1.5 text-charcoal hover:text-sand transition-colors"
                            >
                              <Minus size={12} strokeWidth={2} />
                            </button>
                            <span className="px-3 py-1.5 text-sm text-charcoal border-x border-sand/40 min-w-[32px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.cartKey, item.quantity + 1)}
                              className="px-2.5 py-1.5 text-charcoal hover:text-sand transition-colors"
                            >
                              <Plus size={12} strokeWidth={2} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.cartKey)}
                            className="text-charcoal/30 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={15} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="text-end flex-shrink-0">
                        <p className="text-sm font-medium text-charcoal">
                          {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-sand">{t('ر.ق', 'QAR')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-sand/20 p-6 sticky top-24">
                  <h2 className="text-sm tracking-widest uppercase text-charcoal mb-6">
                    {t('ملخص الطلب', 'Order Summary')}
                  </h2>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">{t('المجموع الفرعي', 'Subtotal')}</span>
                      <span className="text-charcoal">{total.toFixed(2)} {t('ر.ق', 'QAR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal/60">{t('الشحن', 'Shipping')}</span>
                      <span className={shipping === 0 ? 'text-green-700' : 'text-charcoal'}>
                        {shipping === 0 ? t('مجاني', 'Free') : `${shipping.toFixed(2)} ${t('ر.ق', 'QAR')}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-[10px] text-sand tracking-wide">
                        {t('شحن مجاني عند الطلب بـ 200 ر.ق أو أكثر', 'Free shipping on orders over 200 QAR')}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-sand/20 pt-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm tracking-widest uppercase text-charcoal">{t('الإجمالي', 'Total')}</span>
                      <span className="text-xl font-light text-charcoal">
                        {grandTotal.toFixed(2)} <span className="text-sm text-sand">{t('ر.ق', 'QAR')}</span>
                      </span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <span className="flex items-center justify-center gap-2 w-full bg-charcoal text-cream py-4 text-sm tracking-widest uppercase hover:bg-charcoal-light transition-colors">
                      {t('إتمام الطلب', 'Proceed to Checkout')}
                      <ArrowRight size={14} className={dir === 'rtl' ? 'rotate-180' : ''} />
                    </span>
                  </Link>

                  <Link href="/products" className="block text-center mt-4 text-xs tracking-widest uppercase text-charcoal/40 hover:text-sand transition-colors">
                    {t('← متابعة التسوق', 'Continue Shopping →')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
