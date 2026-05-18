'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, Package, ShoppingCart, ArrowRight, Loader } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, dir } = useLang()
  const { user, isAdmin, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace('/auth/login')
    }
  }, [user, isAdmin, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader size={24} className="animate-spin text-sand" strokeWidth={1.5} />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: t('لوحة التحكم', 'Dashboard') },
    { href: '/admin/products', icon: Package, label: t('المنتجات', 'Products') },
    { href: '/admin/orders', icon: ShoppingCart, label: t('الطلبات', 'Orders') },
  ]

  return (
    <div className="min-h-screen bg-cream flex" dir={dir}>
      {/* Sidebar */}
      <aside className="w-56 bg-charcoal flex flex-col fixed inset-y-0 start-0 z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-cream/10">
          <div className="text-lg font-light tracking-[0.2em] text-cream uppercase">
            {t('دوحة', 'DOHA')}
          </div>
          <div className="text-[9px] tracking-[0.5em] text-sand uppercase mt-0.5">
            {t('الإدارة', 'ADMIN')}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-sand/20 text-sand'
                    : 'text-cream/50 hover:text-cream hover:bg-cream/5'
                }`}
              >
                <item.icon size={16} strokeWidth={1.5} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Back to store */}
        <div className="px-3 py-4 border-t border-cream/10">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-cream/30 hover:text-sand transition-colors"
          >
            <ArrowRight size={14} strokeWidth={1.5} className="rotate-180" />
            {t('الموقع', 'Store')}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ms-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-sand/20 px-8 py-4 flex items-center justify-between">
          <h1 className="text-sm tracking-widest uppercase text-charcoal/60">
            {navItems.find((n) => n.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(n.href))?.label}
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-charcoal/40">{t('متصل', 'Online')}</span>
          </div>
        </header>

        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
