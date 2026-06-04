'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, LogOut, User, ChevronDown } from 'lucide-react'
import { useLang, STATUS_LABELS } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const STATUS_COLORS: Record<string, string> = {
  pending:        'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed:      'bg-blue-50 text-blue-700 border-blue-200',
  processing:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped:        'bg-purple-50 text-purple-700 border-purple-200',
  delivered:      'bg-green-50 text-green-700 border-green-200',
  cancelled:      'bg-red-50 text-red-700 border-red-200',
  payment_failed: 'bg-red-50 text-red-700 border-red-200',
}


export default function AccountPage() {
  const { t, dir } = useLang()
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [fetching, setFetching] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*')
      .or(`user_id.eq.${user.id},customer_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) ?? [])
        setFetching(false)
      })
  }, [user])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-cream" />
  }

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen bg-cream" dir={dir}>
        <div className="max-w-4xl mx-auto px-6 py-12">

          {/* Page header */}
          <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs tracking-[0.4em] uppercase text-sand mb-2">{t('حسابي', 'My Account')}</p>
              <h1 className="text-4xl font-light text-charcoal">
                {t(`أهلاً، ${profile?.full_name?.split(' ')[0] ?? ''}`, `Hello, ${profile?.full_name?.split(' ')[0] ?? ''}`)}
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-charcoal/40 hover:text-red-400 transition-colors border border-sand/30 px-4 py-2"
            >
              <LogOut size={13} strokeWidth={1.5} />
              {t('تسجيل الخروج', 'Sign Out')}
            </button>
          </div>

          {/* Profile card */}
          <div className="bg-white border border-sand/20 p-6 mb-8 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-sand/10 border border-sand/30 flex items-center justify-center flex-shrink-0">
              <User size={22} strokeWidth={1.3} className="text-sand" />
            </div>
            <div>
              <p className="font-medium text-charcoal">{profile?.full_name ?? '—'}</p>
              <p className="text-sm text-charcoal/50 mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Orders */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Package size={18} strokeWidth={1.3} className="text-sand" />
              <h2 className="text-sm tracking-widest uppercase text-charcoal">
                {t('طلباتي', 'My Orders')} {!fetching && `(${orders.length})`}
              </h2>
            </div>

            {fetching ? (
              <div className="py-16 text-center text-sand text-sm tracking-widest">
                {t('جاري التحميل...', 'Loading...')}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 text-center border border-sand/20">
                <Package size={36} strokeWidth={1} className="text-sand/40 mx-auto mb-4" />
                <p className="text-charcoal/40 text-sm mb-6">
                  {t('لا توجد طلبات بعد', 'No orders yet')}
                </p>
                <Link href="/products">
                  <span className="inline-block bg-charcoal text-cream px-6 py-3 text-xs tracking-widest uppercase hover:bg-charcoal-light transition-colors">
                    {t('تسوّق الآن', 'Shop Now')}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-sand/20 divide-y divide-sand/10">
                {orders.map((order) => (
                  <div key={order.id}>
                    <div
                      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-cream/30 transition-colors"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <ChevronDown
                        size={14}
                        className={`text-sand flex-shrink-0 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal">
                          {order.order_number ?? `#${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-charcoal/40 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString(
                            dir === 'rtl' ? 'ar-QA' : 'en-GB',
                            { day: '2-digit', month: 'short', year: 'numeric' }
                          )}
                        </p>
                      </div>
                      <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 border flex-shrink-0 ${STATUS_COLORS[order.status]}`}>
                        {t(STATUS_LABELS[order.status]?.ar ?? order.status, STATUS_LABELS[order.status]?.en ?? order.status)}
                      </span>
                      <span className="text-sm text-charcoal flex-shrink-0">
                        {(order.total ?? 0).toFixed(2)} {t('ر.ق', 'QAR')}
                      </span>
                    </div>

                    {expanded === order.id && (
                      <div className="bg-cream/20 px-5 py-5 border-t border-sand/10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {[
                            { label: t('المجموع الفرعي', 'Subtotal'), value: `${order.subtotal.toFixed(2)} ${t('ر.ق', 'QAR')}` },
                            { label: t('الشحن', 'Shipping'), value: `${order.shipping_cost.toFixed(2)} ${t('ر.ق', 'QAR')}` },
                            { label: t('الخصم', 'Discount'), value: `${order.discount_amount.toFixed(2)} ${t('ر.ق', 'QAR')}` },
                            { label: t('الإجمالي', 'Total'), value: `${(order.total ?? 0).toFixed(2)} ${t('ر.ق', 'QAR')}` },
                          ].map((item) => (
                            <div key={item.label}>
                              <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-1">{item.label}</p>
                              <p className="font-medium text-charcoal">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-sand/10">
                            <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-1">
                              {t('عنوان التوصيل', 'Delivery Address')}
                            </p>
                            <p className="text-sm text-charcoal/60">
                              {Object.values(order.shipping_address).filter(Boolean).join('، ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
