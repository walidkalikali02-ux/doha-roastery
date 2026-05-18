'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar')
  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en)
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
