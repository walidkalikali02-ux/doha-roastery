'use client'
import { useState } from 'react'
import { ChevronDown, Search, RefreshCw } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'

interface Props { initialOrders: Order[] }

const ALL_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  payment_failed: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_AR: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  payment_failed: 'فشل الدفع',
}

export default function AdminOrdersClient({ initialOrders }: Props) {
  const { t, dir } = useLang()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      (o.order_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.guest_email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  async function updateStatus(id: string, status: Order['status']) {
    setUpdating(id)
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setOrders(orders.map((o) => (o.id === id ? (data as Order) : o)))
    }
    setUpdating(null)
  }

  const totalRevenue = filtered.reduce((s, o) => s + (o.total ?? 0), 0)

  return (
    <div dir={dir} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm tracking-widest uppercase text-charcoal">
          {t('الطلبات', 'Orders')} ({filtered.length})
        </h2>
        <div className="text-sm text-charcoal/60">
          {t('الإجمالي:', 'Total:')} <span className="text-charcoal font-medium">{totalRevenue.toFixed(2)} {t('ر.ق', 'QAR')}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-sand" />
          <input
            type="text"
            placeholder={t('بحث برقم الطلب أو البريد...', 'Search by order # or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 border border-sand/30 bg-white text-sm text-charcoal focus:outline-none focus:border-charcoal"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-sand/30 bg-white text-sm text-charcoal px-3 py-2.5 focus:outline-none focus:border-charcoal"
        >
          <option value="all">{t('جميع الحالات', 'All Statuses')}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{dir === 'rtl' ? STATUS_AR[s] : s}</option>
          ))}
        </select>
      </div>

      {/* Status summary pills */}
      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map((s) => {
          const count = orders.filter((o) => o.status === s).length
          if (!count) return null
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`text-[10px] tracking-widest uppercase px-3 py-1 border transition-colors ${
                statusFilter === s ? STATUS_COLORS[s] : 'border-sand/30 text-charcoal/50 hover:border-charcoal/30'
              }`}
            >
              {dir === 'rtl' ? STATUS_AR[s] : s} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      <div className="bg-white border border-sand/20 divide-y divide-sand/10">
        {filtered.length === 0 && (
          <div className="py-20 text-center text-charcoal/30 text-xs tracking-widest">
            {t('لا توجد طلبات', 'No orders')}
          </div>
        )}
        {filtered.map((order) => (
          <div key={order.id}>
            {/* Order row */}
            <div
              className="flex items-center gap-4 px-5 py-4 hover:bg-cream/30 transition-colors cursor-pointer"
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <ChevronDown
                size={14}
                className={`text-sand flex-shrink-0 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-charcoal">
                    {order.order_number ?? `#${order.id.slice(0, 8)}`}
                  </span>
                  <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[order.status]}`}>
                    {dir === 'rtl' ? STATUS_AR[order.status] : order.status}
                  </span>
                </div>
                <p className="text-xs text-charcoal/40 mt-0.5">
                  {order.guest_email ?? '—'} · {new Date(order.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="text-sm text-charcoal flex-shrink-0">
                {(order.total ?? 0).toFixed(2)} {t('ر.ق', 'QAR')}
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === order.id && (
              <div className="bg-cream/30 px-5 py-5 border-t border-sand/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: t('المجموع الفرعي', 'Subtotal'), value: `${order.subtotal.toFixed(2)} ${t('ر.ق', 'QAR')}` },
                    { label: t('الشحن', 'Shipping'), value: `${order.shipping_cost.toFixed(2)} ${t('ر.ق', 'QAR')}` },
                    { label: t('الخصم', 'Discount'), value: `${order.discount_amount.toFixed(2)} ${t('ر.ق', 'QAR')}` },
                    { label: t('الإجمالي', 'Total'), value: `${(order.total ?? 0).toFixed(2)} ${t('ر.ق', 'QAR')}` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-charcoal">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Shipping address */}
                {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] tracking-widest uppercase text-charcoal/40 mb-2">
                      {t('عنوان الشحن', 'Shipping Address')}
                    </p>
                    <p className="text-sm text-charcoal/70">
                      {Object.values(order.shipping_address).filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {/* Status update */}
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs tracking-widest uppercase text-charcoal/40">
                    {t('تحديث الحالة:', 'Update Status:')}
                  </p>
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); updateStatus(order.id, s as Order['status']) }}
                      disabled={order.status === s || updating === order.id}
                      className={`text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
                        order.status === s
                          ? STATUS_COLORS[s] + ' cursor-default'
                          : 'border-sand/30 text-charcoal/50 hover:border-charcoal hover:text-charcoal'
                      } disabled:opacity-40`}
                    >
                      {updating === order.id && s === order.status
                        ? <RefreshCw size={10} className="animate-spin" />
                        : (dir === 'rtl' ? STATUS_AR[s] : s)
                      }
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
