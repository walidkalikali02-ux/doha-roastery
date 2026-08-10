'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X, RefreshCw, CreditCard, Banknote, ChevronRight } from 'lucide-react'
import { useLang, STATUS_LABELS } from '@/contexts/LanguageContext'
import { fetchAdminOrders } from '@/lib/admin-orders'
import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'

interface OrderItem {
  id: string
  product_name: string | null
  variant_name: string | null
  sku: string | null
  quantity: number | null
  unit_price: number | null
  total_price: number | null
}

interface Props { initialOrders: Order[] }

const ALL_STATUSES = ['pending', 'paid', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'] as const

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:        { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  paid:           { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500' },
  confirmed:      { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'  },
  processing:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500'},
  shipped:        { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500'},
  delivered:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
  cancelled:      { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'   },
  payment_failed: { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'   },
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang()
  const s = STATUS_BADGE[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
  const label = STATUS_LABELS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(label?.ar ?? status, label?.en ?? status)}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminOrdersClient({ initialOrders }: Props) {
  const { t } = useLang()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const refreshOrders = useCallback(async () => {
    const next = await fetchAdminOrders()
    setOrders(next)
  }, [])

  useEffect(() => { setOrders(initialOrders) }, [initialOrders])

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new as Order, ...prev.filter((o) => o.id !== (payload.new as Order).id)])
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order
          setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
          setSelectedOrder((prev) => prev?.id === updated.id ? updated : prev)
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as { id?: string }).id
          if (deletedId) setOrders((prev) => prev.filter((o) => o.id !== deletedId))
          else void refreshOrders()
        }
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [refreshOrders])

  async function openOrder(order: Order) {
    setSelectedOrder(order)
    setItems([])
    setItemsLoading(true)
    try {
      const res = await fetch(`/api/admin/orders?id=${order.id}`)
      const json = await res.json()
      setItems(json.data ?? [])
    } finally {
      setItemsLoading(false)
    }
  }

  function closeDrawer() {
    setSelectedOrder(null)
    setItems([])
  }

  async function updateStatus(id: string, status: Order['status']) {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setOrders((prev) => prev.map((o) => o.id === id ? json.data as Order : o))
        setSelectedOrder(json.data as Order)
      }
    } finally {
      setUpdating(false)
    }
  }

  const tabs = [
    { key: 'all', label: t('الكل', 'All') },
    { key: 'pending', label: t('معلق', 'Pending') },
    { key: 'paid', label: t('مدفوع', 'Paid') },
    { key: 'confirmed', label: t('مؤكد', 'Confirmed') },
    { key: 'processing', label: t('قيد التجهيز', 'Processing') },
    { key: 'shipped', label: t('تم الشحن', 'Shipped') },
    { key: 'delivered', label: t('تم التسليم', 'Delivered') },
    { key: 'cancelled', label: t('ملغي', 'Cancelled') },
  ]

  const filtered = orders.filter((o) => {
    const matchTab = tab === 'all' || o.status === tab
    const matchSearch = !search ||
      (o.order_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (o.guest_email ?? '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const addr = selectedOrder?.shipping_address ?? {}
  const customerName = [addr.first_name, addr.last_name].filter(Boolean).join(' ') || '—'
  const isCard = !!(selectedOrder?.mf_invoice_id)

  return (
    <div className="h-full flex flex-col gap-0 -m-4 md:-m-8">

      {/* Page header */}
      <div className="px-4 md:px-8 pt-6 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('الطلبات', 'Orders')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} {t('طلب', 'orders')}</p>
          </div>
          <button
            onClick={refreshOrders}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            {t('تحديث', 'Refresh')}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" />
          <input
            type="text"
            placeholder={t('البحث بالرقم أو الإيميل...', 'Search by order # or email...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 overflow-x-auto -mb-px">
          {tabs.map((tabItem) => {
            const count = tabItem.key === 'all' ? orders.length : orders.filter((o) => o.status === tabItem.key).length
            return (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === tabItem.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tabItem.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    tab === tabItem.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-auto bg-gray-50 flex">
        <div className={`flex-1 transition-all duration-300 ${selectedOrder ? 'md:mr-[520px]' : ''}`}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-sm">{t('لا توجد طلبات', 'No orders found')}</p>
            </div>
          ) : (
            <div className="bg-white border-b border-gray-200">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr_auto] gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('الطلب', 'Order')}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('التاريخ', 'Date')}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('العميل', 'Customer')}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('الإجمالي', 'Total')}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('الحالة', 'Status')}</span>
                <span />
              </div>

              {/* Rows */}
              {filtered.map((order) => (
                <button
                  key={order.id}
                  onClick={() => selectedOrder?.id === order.id ? closeDrawer() : openOrder(order)}
                  className={`w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1.5fr_2fr_1fr_1.5fr_auto] gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors group ${
                    selectedOrder?.id === order.id ? 'bg-blue-50/60' : ''
                  }`}
                >
                  {/* Order # */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {order.order_number ?? `#${order.id.slice(0, 8)}`}
                    </span>
                    <span className="text-xs text-gray-400 md:hidden mt-0.5">{formatDate(order.created_at)}</span>
                  </div>

                  {/* Date */}
                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-gray-600">{formatDate(order.created_at)}</span>
                  </div>

                  {/* Customer */}
                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-gray-700 truncate max-w-[180px]">{order.guest_email ?? '—'}</span>
                  </div>

                  {/* Total */}
                  <div className="hidden md:flex items-center">
                    <span className="text-sm font-medium text-gray-900">{(order.total ?? 0).toFixed(2)}<span className="text-xs text-gray-400 ml-1">QAR</span></span>
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center">
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Mobile: status + total + chevron */}
                  <div className="flex flex-col items-end gap-1 md:hidden">
                    <span className="text-sm font-medium text-gray-900">{(order.total ?? 0).toFixed(2)} QAR</span>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Chevron */}
                  <div className="hidden md:flex items-center">
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drawer */}
        {selectedOrder && (
          <>
            {/* Backdrop (mobile) */}
            <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={closeDrawer} />

            {/* Panel */}
            <div
              ref={drawerRef}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[520px] bg-white shadow-2xl z-30 flex flex-col overflow-hidden border-l border-gray-200"
              style={{ top: '0' }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {selectedOrder.order_number ?? `#${selectedOrder.id.slice(0, 8)}`}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedOrder.status} />
                  <button onClick={closeDrawer} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">

                {/* Customer */}
                <section className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('العميل', 'Customer')}</h3>
                  <div className="space-y-1.5">
                    {customerName !== '—' && (
                      <p className="text-sm font-medium text-gray-900">{customerName}</p>
                    )}
                    {selectedOrder.guest_email && (
                      <p className="text-sm text-gray-600">{selectedOrder.guest_email}</p>
                    )}
                    {addr.phone && (
                      <p className="text-sm text-gray-600">{addr.phone}</p>
                    )}
                  </div>
                </section>

                {/* Shipping */}
                {Object.keys(addr).length > 0 && (
                  <section className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('عنوان التوصيل', 'Delivery Address')}</h3>
                    <div className="space-y-0.5">
                      {addr.address && <p className="text-sm text-gray-700">{addr.address}</p>}
                      {(addr.area || addr.city) && (
                        <p className="text-sm text-gray-700">{[addr.area, addr.city].filter(Boolean).join(', ')}</p>
                      )}
                      {addr.shipping_zone && (
                        <p className="text-xs text-gray-400 mt-1">{t('منطقة الشحن:', 'Zone:')} {addr.shipping_zone}</p>
                      )}
                      {addr.notes && (
                        <p className="text-xs text-gray-400 mt-1">{t('ملاحظات:', 'Notes:')} {addr.notes}</p>
                      )}
                    </div>
                  </section>
                )}

                {/* Items */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('المنتجات', 'Items')}</h3>
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw size={16} className="animate-spin text-gray-400" />
                    </div>
                  ) : items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">{t('لا توجد منتجات', 'No items found')}</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-white">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.product_name ?? '—'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {[item.variant_name, item.sku].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right ml-4">
                            <p className="text-sm text-gray-700">x{item.quantity}</p>
                            <p className="text-xs text-gray-400">{((item.unit_price ?? 0)).toFixed(2)} QAR</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Summary */}
                <section className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('ملخص الطلب', 'Summary')}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('المجموع الفرعي', 'Subtotal')}</span>
                      <span className="text-gray-900">{selectedOrder.subtotal.toFixed(2)} QAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('الشحن', 'Shipping')}</span>
                      <span className="text-gray-900">{selectedOrder.shipping_cost.toFixed(2)} QAR</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('الخصم', 'Discount')}</span>
                        <span className="text-green-600">−{selectedOrder.discount_amount.toFixed(2)} QAR</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">{t('الإجمالي', 'Total')}</span>
                      <span className="text-gray-900">{(selectedOrder.total ?? 0).toFixed(2)} QAR</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {isCard
                        ? <><CreditCard size={13} className="text-gray-400" /><span className="text-xs text-gray-500">{t('دفع بالبطاقة', 'Paid by card')}</span></>
                        : <><Banknote size={13} className="text-gray-400" /><span className="text-xs text-gray-500">{t('الدفع عند الاستلام', 'Cash on delivery')}</span></>
                      }
                    </div>
                  </div>
                </section>

                {/* Status update */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('تحديث الحالة', 'Update Status')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.map((s) => {
                      const label = STATUS_LABELS[s]
                      const isActive = selectedOrder.status === s
                      const badge = STATUS_BADGE[s]
                      return (
                        <button
                          key={s}
                          onClick={() => !isActive && updateStatus(selectedOrder.id, s)}
                          disabled={isActive || updating}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:cursor-default ${
                            isActive
                              ? `${badge.bg} ${badge.text} border-transparent`
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          } disabled:opacity-60`}
                        >
                          {updating && isActive
                            ? <RefreshCw size={11} className="animate-spin" />
                            : t(label?.ar ?? s, label?.en ?? s)
                          }
                        </button>
                      )
                    })}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
