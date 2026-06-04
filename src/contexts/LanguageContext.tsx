'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Lang } from '@/lib/types'

interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (ar: string, en: string) => string
  dir: 'rtl' | 'ltr'
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
  t: (ar) => ar,
  dir: 'rtl',
})

export const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending:        { ar: 'معلق',        en: 'Pending' },
  confirmed:      { ar: 'مؤكد',        en: 'Confirmed' },
  processing:     { ar: 'قيد التجهيز', en: 'Processing' },
  shipped:        { ar: 'تم الشحن',    en: 'Shipped' },
  delivered:      { ar: 'تم التسليم',  en: 'Delivered' },
  cancelled:      { ar: 'ملغي',        en: 'Cancelled' },
  payment_failed: { ar: 'فشل الدفع',   en: 'Payment Failed' },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  // Load saved language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('doha_lang') as Lang | null
      if (saved === 'ar' || saved === 'en') setLangState(saved)
    } catch {}
  }, [])

  // Sync html element dir + lang whenever language changes
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  function setLang(l: Lang) {
    setLangState(l)
    try { localStorage.setItem('doha_lang', l) } catch {}
  }

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
