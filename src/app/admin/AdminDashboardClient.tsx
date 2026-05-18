'use client'
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import { Order } from '@/lib/types'

interface Props {
  stats: { totalProducts: number; totalOrders: number; totalRevenue: number }
  recentOrders: Order[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  payment_failed: 'bg-red-100 text-red-800',
}

export default function AdminDashboardClient({ stats, recentOrders }: Props) {
  const { t, dir } = useLang()

  const cards = [
    {
      label: t('إجمالي المنتجات', 'Total Products'),
      value: stats.totalProducts,
      icon: Package,
      href: '/admin/products',
      unit: '',
    },
    {
      label: t('إجمالي الطلبات', 'Total Orders'),
      value: stats.totalOrders,
      icon: ShoppingCart,
      href: '/admin/orders',
      unit: '',
    },
    {
      label: t('الإيرادات', 'Revenue'),
      value: stats.totalRevenue.toFixed(0),
      icon: DollarSign,
      href: '/admin/orders',
      unit: t('ر.ق', 'QAR'),
    },
    {
      label: t('الطلبات المعلّقة', 'Pending Orders'),
      value: recentOrders.filter((o) => o.status === 'pending').length,
      icon: TrendingUp,
      href: '/admin/orders',
      unit: '',
    },
  ]

  return (
    <div dir={dir} className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="bg-white border border-sand/20 p-6 hover:border-sand/50 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs tracking-widest uppercase text-charcoal/50">{card.label}</p>
                <card.icon size={18} strokeWidth={1.3} className="text-sand group-hover:text-gold transition-colors" />
              </div>
              <p className="text-3xl font-light text-charcoal">
                {card.value}
                {card.unit && (
                  <span className="text-base text-sand ms-1">{card.unit}</span>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-sand/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand/10">
          <h2 className="text-sm tracking-widest uppercase text-charcoal">
            {t('آخر الطلبات', 'Recent Orders')}
          </h2>
          <Link href="/admin/orders">
            <span className="text-xs tracking-widest uppercase text-sand hover:text-gold transition-colors">
              {t('عرض الكل', 'View All')}
            </span>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-16 text-center text-charcoal/30 text-sm tracking-widest">
            {t('لا توجد طلبات بعد', 'No orders yet')}
          </div>
        ) : (
          <div className="divide-y divide-sand/10">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    {order.order_number ?? order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-charcoal/40 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString(
                      dir === 'rtl' ? 'ar-QA' : 'en-GB',
                      { day: '2-digit', month: 'short', year: 'numeric' }
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-charcoal">
                    {(order.total ?? 0).toFixed(2)} {t('ر.ق', 'QAR')}
                  </span>
                  <span className={`text-[10px] tracking-widest uppercase px-2 py-1 ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {t(order.status, order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-5">
        <Link href="/admin/products">
          <div className="bg-charcoal text-cream p-6 hover:bg-charcoal-light transition-colors">
            <Package size={24} strokeWidth={1.3} className="text-sand mb-3" />
            <p className="text-sm tracking-widest uppercase">
              {t('إضافة منتج', 'Add Product')}
            </p>
          </div>
        </Link>
        <Link href="/admin/orders">
          <div className="border-2 border-charcoal text-charcoal p-6 hover:bg-cream-dark transition-colors">
            <ShoppingCart size={24} strokeWidth={1.3} className="text-sand mb-3" />
            <p className="text-sm tracking-widest uppercase">
              {t('إدارة الطلبات', 'Manage Orders')}
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
