'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ShoppingBag, User, LogOut, LayoutDashboard, Package } from 'lucide-react'
import { useLang } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { lang, setLang, t, dir } = useLang()
  const { count } = useCart()
  const { user, profile, signOut, isAdmin } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close user dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const links = [
    { href: '/', label: t('الرئيسية', 'Home') },
    { href: '/products', label: t('المنتجات', 'Products') },
    { href: '/wholesale', label: t('الجملة', 'Wholesale') },
    { href: '/about', label: t('من نحن', 'About') },
    { href: '/contact', label: t('تواصل', 'Contact') },
  ]

  async function handleSignOut() {
    await signOut()
    setUserMenu(false)
    router.push('/')
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-sand/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" dir={dir}>

        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-xl font-light tracking-[0.2em] text-charcoal uppercase">
            {t('دوحة', 'DOHA')}
          </span>
          <span className="text-[10px] tracking-[0.5em] text-sand uppercase">
            {t('رواسترز', 'ROASTERY')}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="text-sm tracking-widest uppercase text-charcoal hover:text-sand transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-xs tracking-widest uppercase text-charcoal-light hover:text-sand transition-colors border border-sand/40 px-2 py-1"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

          {/* Cart */}
          <Link href="/cart" className="relative text-charcoal hover:text-sand transition-colors">
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-2 -end-2 w-4 h-4 bg-sand text-charcoal text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>

          {/* User auth */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 text-charcoal hover:text-sand transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-sand/20 border border-sand/40 flex items-center justify-center">
                  <User size={14} strokeWidth={1.5} className="text-charcoal" />
                </div>
                <span className="hidden md:block text-xs tracking-wide max-w-[80px] truncate">
                  {profile?.full_name?.split(' ')[0] ?? t('حسابي', 'Account')}
                </span>
              </button>

              {/* Dropdown */}
              {userMenu && (
                <div className={`absolute top-full mt-2 w-48 bg-white border border-sand/20 shadow-lg py-1 z-50 ${dir === 'rtl' ? 'start-0' : 'end-0'}`}>
                  <div className="px-4 py-3 border-b border-sand/10">
                    <p className="text-xs font-medium text-charcoal truncate">{profile?.full_name ?? user.email}</p>
                    <p className="text-[10px] text-charcoal/40 truncate mt-0.5">{user.email}</p>
                  </div>

                  <Link href="/account" onClick={() => setUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors">
                    <Package size={14} strokeWidth={1.5} className="text-sand" />
                    {t('طلباتي', 'My Orders')}
                  </Link>

                  {isAdmin && (
                    <Link href="/admin" onClick={() => setUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors">
                      <LayoutDashboard size={14} strokeWidth={1.5} className="text-sand" />
                      {t('لوحة الإدارة', 'Admin Panel')}
                    </Link>
                  )}

                  <div className="border-t border-sand/10 mt-1">
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} strokeWidth={1.5} />
                      {t('تسجيل الخروج', 'Sign Out')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login"
              className="hidden md:flex items-center gap-1.5 text-xs tracking-widest uppercase text-charcoal hover:text-sand transition-colors border border-sand/40 px-3 py-1.5 hover:border-sand">
              <User size={13} strokeWidth={1.5} />
              {t('دخول', 'Sign In')}
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden text-charcoal hover:text-sand transition-colors"
            onClick={() => setOpen(!open)} aria-label="toggle menu">
            {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-cream border-t border-sand/20 px-6 py-6 flex flex-col gap-4" dir={dir}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="text-sm tracking-widest uppercase text-charcoal hover:text-sand transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="border-t border-sand/20 pt-4 flex flex-col gap-3">
            {user ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)}
                  className="text-sm tracking-widest uppercase text-charcoal hover:text-sand transition-colors">
                  {t('طلباتي', 'My Orders')}
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)}
                    className="text-sm tracking-widest uppercase text-charcoal hover:text-sand transition-colors">
                    {t('الإدارة', 'Admin')}
                  </Link>
                )}
                <button onClick={handleSignOut}
                  className="text-start text-sm tracking-widest uppercase text-red-400 hover:text-red-500 transition-colors">
                  {t('تسجيل الخروج', 'Sign Out')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)}
                  className="text-sm tracking-widest uppercase text-charcoal hover:text-sand transition-colors">
                  {t('تسجيل الدخول', 'Sign In')}
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)}
                  className="text-sm tracking-widest uppercase text-charcoal hover:text-sand transition-colors">
                  {t('إنشاء حساب', 'Register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
