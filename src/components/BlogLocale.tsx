'use client'
import { useEffect } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import type { BlogLang } from '@/lib/blog-types'

// The crawlable URL determines the article language, including the shared shell.
export default function BlogLocale({ lang }: { lang: BlogLang }) {
  const { lang: current, setLang } = useLang()
  useEffect(() => {
    const timer = window.setTimeout(() => { if (current !== lang) setLang(lang) }, 0)
    return () => window.clearTimeout(timer)
  }, [lang, current, setLang])
  return null
}
