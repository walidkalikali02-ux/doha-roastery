'use client'
import { useEffect, useState, useRef } from 'react'
import { Bell, X, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/contexts/LanguageContext'

interface OrderNotification {
  id: string
  order_number: string
  customer_email: string | null
  customer_name: string | null
  total: number
  items_count: number
  is_read: boolean
  created_at: string
}

export default function AdminNotificationBell() {
  const { t } = useLang()
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<OrderNotification | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  /* Load recent notifications on mount */
  useEffect(() => {
    supabase
      .from('order_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications((data as OrderNotification[]) ?? []))
  }, [])

  /* Subscribe to realtime new orders */
  useEffect(() => {
    const channel = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_notifications' },
        (payload) => {
          const newNote = payload.new as OrderNotification
          setNotifications(prev => [newNote, ...prev])
          setToast(newNote)
          // Auto-hide toast after 6 seconds
          setTimeout(() => setToast(null), 6000)
          // Browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(t('طلب جديد! 🛍', 'New Order! 🛍'), {
              body: `${newNote.order_number} — ${Number(newNote.total).toFixed(2)} QAR`,
              icon: '/favicon.ico',
            })
          }
        }
      )
      .subscribe()

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => { supabase.removeChannel(channel) }
  }, [t])

  /* Close panel on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markAllRead() {
    const ids = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!ids.length) return
    await supabase
      .from('order_notifications')
      .update({ is_read: true })
      .in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('order_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  function timeAgo(dateStr: string) {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return t('الآن', 'just now')
    if (diff < 3600) return t(`${Math.floor(diff / 60)} دقيقة`, `${Math.floor(diff / 60)}m ago`)
    if (diff < 86400) return t(`${Math.floor(diff / 3600)} ساعة`, `${Math.floor(diff / 3600)}h ago`)
    return t(`${Math.floor(diff / 86400)} يوم`, `${Math.floor(diff / 86400)}d ago`)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Bell button ── */}
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        className="relative flex items-center justify-center w-9 h-9 text-charcoal/50 hover:text-charcoal transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Toast popup (bottom-right) ── */}
      {toast && (
        <div className="fixed bottom-6 end-6 z-[100] w-80 bg-charcoal text-cream shadow-2xl border-s-4 border-sand animate-fade-up">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} strokeWidth={1.5} className="text-sand flex-shrink-0" />
                <p className="text-xs tracking-widest uppercase text-sand">
                  {t('طلب جديد!', 'New Order!')}
                </p>
              </div>
              <button onClick={() => setToast(null)} className="text-cream/30 hover:text-cream transition-colors flex-shrink-0">
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <p className="text-sm font-medium mb-1">{toast.order_number}</p>
            <p className="text-xs text-cream/60">
              {toast.customer_name || toast.customer_email || t('ضيف', 'Guest')}
              {' — '}{Number(toast.total).toFixed(2)} QAR
            </p>
          </div>
        </div>
      )}

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="absolute end-0 top-11 w-80 bg-white border border-sand/20 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand/10">
            <p className="text-xs tracking-widest uppercase text-charcoal">
              {t('الإشعارات', 'Notifications')}
              {unread > 0 && (
                <span className="ms-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-sand hover:text-gold transition-colors tracking-widest uppercase">
                {t('تعليم الكل مقروء', 'Mark all read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-sand/10">
            {notifications.length === 0 && (
              <p className="text-center text-xs text-charcoal/30 py-8 tracking-widest">
                {t('لا توجد إشعارات', 'No notifications yet')}
              </p>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-cream ${!n.is_read ? 'bg-sand/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-red-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-charcoal">{n.order_number}</p>
                      <p className="text-[10px] text-charcoal/30 flex-shrink-0">{timeAgo(n.created_at)}</p>
                    </div>
                    <p className="text-xs text-charcoal/60 truncate">
                      {n.customer_name || n.customer_email || t('ضيف', 'Guest')}
                    </p>
                    <p className="text-xs font-medium text-sand mt-0.5">
                      {Number(n.total).toFixed(2)} QAR · {n.items_count} {t('منتجات', 'items')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-sand/10 text-center">
            <a href="/admin/orders" className="text-[10px] tracking-widest uppercase text-sand hover:text-gold transition-colors">
              {t('عرض كل الطلبات', 'View All Orders')}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
