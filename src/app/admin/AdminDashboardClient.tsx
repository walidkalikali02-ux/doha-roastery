'use client'
import { useCallback, useEffect, useState } from 'react'
import { Package, ShoppingCart, DollarSign, TrendingUp, Receipt, CalendarDays, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useLang, STATUS_LABELS } from '@/contexts/LanguageContext'
import { DailyOrderMetric, fetchAdminOrdersOverview, StatusMetric } from '@/lib/admin-orders'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'

interface Props {
  stats: {
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    avgOrderValue: number
    todayOrders: number
    todayRevenue: number
    deliveredRate: number
  }
  recentOrders: Order[]
  analytics: {
    last7Days: DailyOrderMetric[]
    statusBreakdown: StatusMetric[]
  }
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

export default function AdminDashboardClient({ stats, recentOrders, analytics }: Props) {
  const { t, dir } = useLang()
  const [liveStats, setLiveStats] = useState(stats)
  const [liveRecentOrders, setLiveRecentOrders] = useState(recentOrders)
  const [liveAnalytics, setLiveAnalytics] = useState(analytics)

  const refreshOrdersOverview = useCallback(async () => {
    const overview = await fetchAdminOrdersOverview()

    setLiveStats((prev) => ({
      ...prev,
      totalOrders: overview.totalOrders,
      totalRevenue: overview.totalRevenue,
      pendingOrders: overview.pendingOrders,
      avgOrderValue: overview.avgOrderValue,
      todayOrders: overview.todayOrders,
      todayRevenue: overview.todayRevenue,
      deliveredRate: overview.deliveredRate,
    }))
    setLiveRecentOrders(overview.recentOrders)
    setLiveAnalytics({
      last7Days: overview.last7Days,
      statusBreakdown: overview.statusBreakdown,
    })
  }, [])

  useEffect(() => {
    setLiveStats(stats)
  }, [stats])

  useEffect(() => {
    setLiveRecentOrders(recentOrders)
  }, [recentOrders])

  useEffect(() => {
    setLiveAnalytics(analytics)
  }, [analytics])

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void refreshOrdersOverview()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshOrdersOverview])

  const cards = [
    {
      label: t('إجمالي المنتجات', 'Total Products'),
      value: liveStats.totalProducts,
      icon: Package,
      href: '/admin/products',
      unit: '',
    },
    {
      label: t('إجمالي الطلبات', 'Total Orders'),
      value: liveStats.totalOrders,
      icon: ShoppingCart,
      href: '/admin/orders',
      unit: '',
    },
    {
      label: t('الإيرادات', 'Revenue'),
      value: liveStats.totalRevenue.toFixed(0),
      icon: DollarSign,
      href: '/admin/orders',
      unit: t('ر.ق', 'QAR'),
    },
    {
      label: t('الطلبات المعلّقة', 'Pending Orders'),
      value: liveStats.pendingOrders,
      icon: TrendingUp,
      href: '/admin/orders',
      unit: '',
    },
  ]

  const analyticsCards = [
    {
      label: t('متوسط قيمة الطلب', 'Average Order Value'),
      value: liveStats.avgOrderValue.toFixed(2),
      suffix: t('ر.ق', 'QAR'),
      icon: Receipt,
    },
    {
      label: t('طلبات اليوم', 'Today Orders'),
      value: liveStats.todayOrders.toString(),
      suffix: '',
      icon: CalendarDays,
    },
    {
      label: t('إيراد اليوم', 'Today Revenue'),
      value: liveStats.todayRevenue.toFixed(2),
      suffix: t('ر.ق', 'QAR'),
      icon: DollarSign,
    },
    {
      label: t('معدل التسليم', 'Delivered Rate'),
      value: liveStats.deliveredRate.toFixed(0),
      suffix: '%',
      icon: CheckCircle2,
    },
  ]

  const maxRevenue = Math.max(...liveAnalytics.last7Days.map((day) => day.revenue), 1)
  const maxStatusCount = Math.max(...liveAnalytics.statusBreakdown.map((item) => item.count), 1)

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

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="bg-white border border-sand/20">
          <div className="flex items-center justify-between px-6 py-4 border-b border-sand/10">
            <div>
              <h2 className="text-sm tracking-widest uppercase text-charcoal">
                {t('تحليلات المبيعات', 'Sales Analytics')}
              </h2>
              <p className="mt-1 text-xs text-charcoal/40">
                {t('آخر ٧ أيام من الطلبات والإيرادات', 'Last 7 days of orders and revenue')}
              </p>
            </div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-sand">
              {t('مباشر', 'Live')}
            </span>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            {analyticsCards.map((card) => (
              <div key={card.label} className="border border-sand/15 bg-cream/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] tracking-[0.24em] uppercase text-charcoal/45">{card.label}</p>
                  <card.icon size={16} strokeWidth={1.4} className="text-sand" />
                </div>
                <p className="text-2xl font-light text-charcoal">
                  {card.value}
                  {card.suffix && <span className="ms-1 text-sm text-sand">{card.suffix}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            <div className="grid h-64 grid-cols-7 items-end gap-3 border-t border-sand/10 pt-6">
              {liveAnalytics.last7Days.map((day) => {
                const height = `${Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 12 : 4)}%`

                return (
                  <div key={day.date} className="flex h-full flex-col justify-end gap-3">
                    <div className="text-center">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-charcoal/35">{day.orders}</p>
                    </div>
                    <div className="relative flex-1 rounded-t-full bg-cream-dark/70">
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-t-full bg-gradient-to-t from-charcoal via-charcoal-light to-sand transition-all duration-500"
                        style={{ height }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-charcoal">{day.label}</p>
                      <p className="mt-1 text-[10px] text-charcoal/45">
                        {day.revenue.toFixed(0)} {t('ر.ق', 'QAR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-white border border-sand/20">
          <div className="px-6 py-4 border-b border-sand/10">
            <h2 className="text-sm tracking-widest uppercase text-charcoal">
              {t('حالة الطلبات', 'Order Status Mix')}
            </h2>
            <p className="mt-1 text-xs text-charcoal/40">
              {t('توزيع الطلبات الحالية حسب الحالة', 'Current order distribution by status')}
            </p>
          </div>

          <div className="space-y-4 p-6">
            {liveAnalytics.statusBreakdown.length === 0 ? (
              <div className="py-10 text-center text-sm tracking-widest text-charcoal/30">
                {t('لا توجد بيانات بعد', 'No analytics yet')}
              </div>
            ) : (
              liveAnalytics.statusBreakdown.map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs tracking-[0.2em] uppercase text-charcoal/55">
                      {t(STATUS_LABELS[item.status]?.ar ?? item.status, STATUS_LABELS[item.status]?.en ?? item.status)}
                    </p>
                    <p className="text-sm font-medium text-charcoal">{item.count}</p>
                  </div>
                  <div className="h-2 overflow-hidden bg-cream-dark/80">
                    <div
                      className="h-full bg-gradient-to-r from-sand via-gold to-charcoal transition-all duration-500"
                      style={{ width: `${(item.count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
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

        {liveRecentOrders.length === 0 ? (
          <div className="py-16 text-center text-charcoal/30 text-sm tracking-widest">
            {t('لا توجد طلبات بعد', 'No orders yet')}
          </div>
        ) : (
          <div className="divide-y divide-sand/10">
            {liveRecentOrders.map((order) => (
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
                    {t(STATUS_LABELS[order.status]?.ar ?? order.status, STATUS_LABELS[order.status]?.en ?? order.status)}
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
