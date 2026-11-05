'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CreditCard, Download, Package, ReceiptText, Search, ShoppingBag, TrendingUp, WalletCards } from 'lucide-react'
import { STATUS_LABELS, useLang } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

type ReportItem = {
  id: string
  product_id: string | null
  product_name: string | null
  variant_name: string | null
  sku: string | null
  quantity: number | null
  unit_price: number | null
  price: number | null
  total_price: number | null
}

export type SalesReportOrder = {
  id: string
  order_number: string | null
  status: string
  total: number | null
  subtotal: number | null
  discount_amount: number | null
  shipping_cost: number | null
  guest_email: string | null
  customer_id: string | null
  shipping_address: Record<string, string> | null
  mf_invoice_id: string | null
  created_at: string
  order_items: ReportItem[]
}

type Period = '7' | '30' | '90' | '365' | 'all' | 'custom'
type Payment = 'all' | 'card' | 'cod'
const SALES_STATUSES = new Set(['paid', 'confirmed', 'processing', 'shipped', 'delivered'])

function dateInput(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function customerName(order: SalesReportOrder) {
  const address = order.shipping_address ?? {}
  return address.full_name || address.name || address.customer_name || order.guest_email || '—'
}

function itemPrice(item: ReportItem) {
  return Number(item.total_price ?? (item.unit_price ?? item.price ?? 0) * (item.quantity ?? 0))
}

export default function SalesReportClient() {
  const { lang, t } = useLang()
  const [orders, setOrders] = useState<SalesReportOrder[]>([])
  const [loadingReport, setLoadingReport] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('30')
  const [status, setStatus] = useState('sales')
  const [payment, setPayment] = useState<Payment>('all')
  const [query, setQuery] = useState('')
  const [today] = useState(() => dateInput(new Date()))
  const [from, setFrom] = useState(() => {
    const start = new Date()
    start.setDate(start.getDate() - 29)
    return dateInput(start)
  })
  const [to, setTo] = useState(() => dateInput(new Date()))

  useEffect(() => {
    let active = true

    async function loadReport() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, total, subtotal, discount_amount, shipping_cost,
          guest_email, customer_id, shipping_address, mf_invoice_id, created_at,
          order_items (id, product_id, product_name, variant_name, sku, quantity, unit_price, price, total_price)
        `)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) {
        setLoadError(error.message)
      } else {
        setOrders((data ?? []) as unknown as SalesReportOrder[])
      }
      setLoadingReport(false)
    }

    void loadReport()
    return () => { active = false }
  }, [])

  const currency = useMemo(() => new Intl.NumberFormat(lang === 'ar' ? 'ar-QA' : 'en-QA', {
    style: 'currency', currency: 'QAR', maximumFractionDigits: 2,
  }), [lang])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-QA' : 'en-QA', {
    day: '2-digit', month: 'short', year: 'numeric',
  }), [lang])

  const filteredOrders = useMemo(() => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    let start: Date | null = null
    let end: Date | null = now
    if (period === 'custom') {
      start = from ? new Date(`${from}T00:00:00`) : null
      end = to ? new Date(`${to}T23:59:59.999`) : null
    } else if (period !== 'all') {
      start = new Date(now)
      start.setDate(start.getDate() - Number(period) + 1)
      start.setHours(0, 0, 0, 0)
    }
    const needle = query.trim().toLowerCase()

    return orders.filter((order) => {
      const created = new Date(order.created_at)
      if (start && created < start) return false
      if (end && created > end) return false
      if (status === 'sales' ? !SALES_STATUSES.has(order.status) : status !== 'all' && order.status !== status) return false
      if (payment === 'card' && !order.mf_invoice_id) return false
      if (payment === 'cod' && order.mf_invoice_id) return false
      if (!needle) return true
      return [order.order_number, order.guest_email, customerName(order), ...order.order_items.flatMap((item) => [item.product_name, item.sku])]
        .some((value) => value?.toLowerCase().includes(needle))
    })
  }, [from, orders, payment, period, query, status, to])

  const metrics = useMemo(() => {
    const revenue = filteredOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0)
    const subtotal = filteredOrders.reduce((sum, order) => sum + Number(order.subtotal ?? 0), 0)
    const discounts = filteredOrders.reduce((sum, order) => sum + Number(order.discount_amount ?? 0), 0)
    const shipping = filteredOrders.reduce((sum, order) => sum + Number(order.shipping_cost ?? 0), 0)
    const units = filteredOrders.reduce((sum, order) => sum + order.order_items.reduce((n, item) => n + Number(item.quantity ?? 0), 0), 0)
    const card = filteredOrders.filter((order) => Boolean(order.mf_invoice_id)).reduce((sum, order) => sum + Number(order.total ?? 0), 0)
    return { revenue, subtotal, discounts, shipping, units, card, cod: revenue - card, average: filteredOrders.length ? revenue / filteredOrders.length : 0 }
  }, [filteredOrders])

  const dailySales = useMemo(() => {
    const groups = new Map<string, { total: number; orders: number }>()
    filteredOrders.forEach((order) => {
      const key = dateInput(new Date(order.created_at))
      const current = groups.get(key) ?? { total: 0, orders: 0 }
      groups.set(key, { total: current.total + Number(order.total ?? 0), orders: current.orders + 1 })
    })
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, value]) => ({ date, ...value }))
  }, [filteredOrders])
  const maxDay = Math.max(...dailySales.map((day) => day.total), 1)

  const topProducts = useMemo(() => {
    const products = new Map<string, { name: string; quantity: number; revenue: number }>()
    filteredOrders.forEach((order) => order.order_items.forEach((item) => {
      const key = item.product_id || `${item.product_name}-${item.variant_name}`
      const current = products.get(key) ?? { name: [item.product_name, item.variant_name].filter(Boolean).join(' · ') || t('منتج غير مسمى', 'Unnamed product'), quantity: 0, revenue: 0 }
      current.quantity += Number(item.quantity ?? 0)
      current.revenue += itemPrice(item)
      products.set(key, current)
    }))
    return [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6)
  }, [filteredOrders, t])

  function exportCsv() {
    const rows = filteredOrders.map((order) => [
      order.order_number || order.id.slice(0, 8), new Date(order.created_at).toISOString(), order.status,
      customerName(order), order.guest_email || '', order.mf_invoice_id ? 'Card' : 'COD',
      order.order_items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
      Number(order.subtotal ?? 0), Number(order.discount_amount ?? 0), Number(order.shipping_cost ?? 0), Number(order.total ?? 0),
    ])
    const csv = [["Order", "Date", "Status", "Customer", "Email", "Payment", "Units", "Subtotal", "Discount", "Shipping", "Total"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `doha-sales-${dateInput(new Date())}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const periodOptions: { value: Period; ar: string; en: string }[] = [
    { value: '7', ar: '7 أيام', en: '7 days' }, { value: '30', ar: '30 يومًا', en: '30 days' },
    { value: '90', ar: '90 يومًا', en: '90 days' }, { value: '365', ar: 'آخر 12 شهرًا', en: 'Last 12 months' },
    { value: 'all', ar: 'كل المدة', en: 'All time' }, { value: 'custom', ar: 'مدة مخصصة', en: 'Custom' },
  ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden border border-sand/25 bg-charcoal p-5 text-cream shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-sand"><TrendingUp size={14} />{t('نظرة مالية', 'Financial overview')}</div>
            <h2 className="text-2xl font-light md:text-3xl">{t('تقرير المبيعات التفصيلي', 'Detailed sales report')}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cream/50">{t('تابع صافي المبيعات والطلبات وطرق الدفع والمنتجات الأكثر أداءً من مكان واحد.', 'Track net sales, orders, payment methods and top products in one place.')}</p>
          </div>
          <button onClick={exportCsv} disabled={!filteredOrders.length} className="flex w-fit items-center gap-2 bg-sand px-4 py-3 text-xs font-medium text-charcoal transition hover:bg-sand-light disabled:opacity-40">
            <Download size={15} />{t('تصدير CSV', 'Export CSV')}
          </button>
        </div>
      </section>

      {loadError && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{t('تعذر تحميل بيانات التقرير:', 'Unable to load report data:')} {loadError}</div>}
      {loadingReport && <div className="border border-sand/20 bg-white px-4 py-8 text-center text-sm text-charcoal/45">{t('جاري تحميل بيانات المبيعات…', 'Loading sales data…')}</div>}

      <section className="border border-sand/20 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1.5fr]">
          <div className="flex flex-wrap gap-1.5">
            {periodOptions.map((option) => <button key={option.value} onClick={() => setPeriod(option.value)} className={`border px-3 py-2 text-xs transition ${period === option.value ? 'border-sand bg-sand/10 text-sand-dark' : 'border-sand/20 text-charcoal/50 hover:border-sand/60'}`}>{t(option.ar, option.en)}</button>)}
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="border border-sand/20 bg-white px-3 py-2 text-xs text-charcoal outline-none focus:border-sand">
            <option value="sales">{t('المبيعات المكتملة', 'Sales statuses')}</option><option value="all">{t('كل الحالات', 'All statuses')}</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{t(label.ar, label.en)}</option>)}
          </select>
          <select value={payment} onChange={(event) => setPayment(event.target.value as Payment)} className="border border-sand/20 bg-white px-3 py-2 text-xs text-charcoal outline-none focus:border-sand">
            <option value="all">{t('كل طرق الدفع', 'All payments')}</option><option value="card">{t('بطاقة', 'Card')}</option><option value="cod">{t('الدفع عند الاستلام', 'Cash on delivery')}</option>
          </select>
          <label className="flex items-center gap-2 border border-sand/20 px-3 focus-within:border-sand"><Search size={14} className="text-charcoal/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('ابحث بالطلب أو العميل أو المنتج', 'Search order, customer or product')} className="min-w-0 flex-1 py-2 text-xs outline-none" /></label>
        </div>
        {period === 'custom' && <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-sand/15 pt-3 text-xs text-charcoal/55"><CalendarDays size={15} className="text-sand-dark" /><label className="flex items-center gap-2">{t('من', 'From')}<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="border border-sand/20 px-2 py-1.5 outline-none" /></label><label className="flex items-center gap-2">{t('إلى', 'To')}<input type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)} className="border border-sand/20 px-2 py-1.5 outline-none" /></label></div>}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: TrendingUp, label: t('صافي المبيعات', 'Net sales'), value: currency.format(metrics.revenue), note: t(`قبل الخصم ${currency.format(metrics.subtotal)}`, `Before discount ${currency.format(metrics.subtotal)}`) },
          { icon: ReceiptText, label: t('عدد الطلبات', 'Orders'), value: filteredOrders.length.toLocaleString(lang), note: t('ضمن الفلاتر الحالية', 'Within current filters') },
          { icon: WalletCards, label: t('متوسط قيمة الطلب', 'Average order value'), value: currency.format(metrics.average), note: t('إجمالي المبيعات ÷ الطلبات', 'Sales divided by orders') },
          { icon: Package, label: t('الوحدات المباعة', 'Units sold'), value: metrics.units.toLocaleString(lang), note: t('عبر الطلبات الظاهرة', 'Across visible orders') },
        ].map((card) => <div key={card.label} className="border border-sand/20 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between text-charcoal/40"><span className="text-xs">{card.label}</span><card.icon size={17} strokeWidth={1.5} className="text-sand-dark" /></div><div className="text-2xl font-light text-charcoal">{card.value}</div><div className="mt-2 text-[11px] text-charcoal/35">{card.note}</div></div>)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="border border-sand/20 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between"><div><h3 className="text-sm text-charcoal">{t('حركة المبيعات', 'Sales movement')}</h3><p className="mt-1 text-[11px] text-charcoal/35">{t('آخر 14 يومًا يحتوي على مبيعات ضمن الفترة', 'Last 14 sales days in the period')}</p></div><div className="text-end"><div className="text-lg font-light">{currency.format(metrics.revenue)}</div><div className="text-[10px] text-charcoal/35">{filteredOrders.length} {t('طلب', 'orders')}</div></div></div>
          {dailySales.length ? <div className="flex h-56 items-end gap-2 border-b border-sand/20 px-1 pb-1">{dailySales.map((day) => <div key={day.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="pointer-events-none mb-2 hidden whitespace-nowrap bg-charcoal px-2 py-1 text-center text-[9px] text-cream group-hover:block">{currency.format(day.total)} · {day.orders}</div><div className="min-h-1 bg-sand transition-colors group-hover:bg-sand-dark" style={{ height: `${Math.max((day.total / maxDay) * 100, 3)}%` }} /><div className="mt-2 truncate text-center text-[9px] text-charcoal/35">{new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(new Date(`${day.date}T12:00:00`))}</div></div>)}</div> : <Empty message={t('لا توجد مبيعات في الفترة المحددة', 'No sales in this period')} />}
        </div>
        <div className="border border-sand/20 bg-white p-5 shadow-sm">
          <h3 className="mb-5 text-sm text-charcoal">{t('تفاصيل التحصيل', 'Collection breakdown')}</h3>
          <div className="space-y-4">
            <Breakdown icon={CreditCard} label={t('بطاقات الدفع', 'Card payments')} value={currency.format(metrics.card)} ratio={metrics.revenue ? metrics.card / metrics.revenue : 0} />
            <Breakdown icon={ShoppingBag} label={t('الدفع عند الاستلام', 'Cash on delivery')} value={currency.format(metrics.cod)} ratio={metrics.revenue ? metrics.cod / metrics.revenue : 0} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 border-t border-sand/15 pt-5"><SmallMetric label={t('الخصومات', 'Discounts')} value={currency.format(metrics.discounts)} /><SmallMetric label={t('الشحن', 'Shipping')} value={currency.format(metrics.shipping)} /></div>
        </div>
      </section>

      <section className="border border-sand/20 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-sand/15 p-5"><div><h3 className="text-sm text-charcoal">{t('المنتجات الأعلى مبيعًا', 'Top-selling products')}</h3><p className="mt-1 text-[11px] text-charcoal/35">{t('مرتبة حسب قيمة المبيعات', 'Ranked by sales value')}</p></div><ShoppingBag size={18} className="text-sand-dark" /></div>
        {topProducts.length ? <div className="divide-y divide-sand/10">{topProducts.map((product, index) => <div key={`${product.name}-${index}`} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 px-5 py-4"><span className="flex size-7 items-center justify-center rounded-full bg-cream text-xs text-sand-dark">{index + 1}</span><div className="min-w-0"><div className="truncate text-sm text-charcoal">{product.name}</div><div className="mt-1 text-[10px] text-charcoal/35">{product.quantity.toLocaleString(lang)} {t('وحدة', 'units')}</div></div><div className="text-sm font-medium text-charcoal">{currency.format(product.revenue)}</div></div>)}</div> : <Empty message={t('لا توجد منتجات ضمن النتائج', 'No products in these results')} />}
      </section>

      <section className="overflow-hidden border border-sand/20 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-sand/15 p-5"><div><h3 className="text-sm text-charcoal">{t('تفاصيل الطلبات', 'Order details')}</h3><p className="mt-1 text-[11px] text-charcoal/35">{filteredOrders.length.toLocaleString(lang)} {t('نتيجة', 'results')}</p></div><ReceiptText size={18} className="text-sand-dark" /></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-start text-xs"><thead className="bg-cream/70 text-charcoal/45"><tr>{[t('الطلب', 'Order'), t('التاريخ', 'Date'), t('العميل', 'Customer'), t('الحالة', 'Status'), t('الدفع', 'Payment'), t('الكمية', 'Units'), t('الإجمالي', 'Total')].map((heading) => <th key={heading} className="px-5 py-3 text-start font-normal">{heading}</th>)}</tr></thead><tbody className="divide-y divide-sand/10">{filteredOrders.slice(0, 100).map((order) => <tr key={order.id} className="hover:bg-cream/30"><td className="px-5 py-4 font-medium text-charcoal">#{order.order_number || order.id.slice(0, 8)}</td><td className="whitespace-nowrap px-5 py-4 text-charcoal/55">{dateFormatter.format(new Date(order.created_at))}</td><td className="max-w-[190px] truncate px-5 py-4 text-charcoal/60">{customerName(order)}</td><td className="px-5 py-4"><span className="bg-cream px-2 py-1 text-[10px] text-sand-dark">{STATUS_LABELS[order.status] ? t(STATUS_LABELS[order.status].ar, STATUS_LABELS[order.status].en) : order.status}</span></td><td className="px-5 py-4 text-charcoal/55">{order.mf_invoice_id ? t('بطاقة', 'Card') : t('عند الاستلام', 'COD')}</td><td className="px-5 py-4 text-charcoal/55">{order.order_items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)}</td><td className="whitespace-nowrap px-5 py-4 font-medium text-charcoal">{currency.format(Number(order.total ?? 0))}</td></tr>)}</tbody></table></div>
        {!filteredOrders.length && <Empty message={t('لا توجد طلبات مطابقة للفلاتر', 'No orders match these filters')} />}
        {filteredOrders.length > 100 && <div className="border-t border-sand/10 p-3 text-center text-[10px] text-charcoal/35">{t('يتم عرض أول 100 طلب. يحتوي ملف CSV على جميع النتائج.', 'Showing the first 100 orders. CSV contains all results.')}</div>}
      </section>
    </div>
  )
}

function Breakdown({ icon: Icon, label, value, ratio }: { icon: typeof CreditCard; label: string; value: string; ratio: number }) {
  return <div><div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-charcoal/55"><Icon size={14} className="text-sand-dark" />{label}</span><span className="text-xs text-charcoal">{value}</span></div><div className="h-1.5 bg-cream"><div className="h-full bg-sand" style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div><div className="mt-1 text-end text-[9px] text-charcoal/30">{(ratio * 100).toFixed(1)}%</div></div>
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-cream/60 p-3"><div className="text-[10px] text-charcoal/35">{label}</div><div className="mt-1 text-sm text-charcoal">{value}</div></div>
}

function Empty({ message }: { message: string }) {
  return <div className="flex min-h-36 items-center justify-center p-6 text-center text-xs text-charcoal/35">{message}</div>
}
