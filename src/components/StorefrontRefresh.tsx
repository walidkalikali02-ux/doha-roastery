'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function StorefrontRefresh() {
  const pathname = usePathname()
  const router = useRouter()
  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const onStorage = (event: StorageEvent) => { if (event.key === 'doha_catalog_updated') refresh() }
    window.addEventListener('focus', refresh)
    window.addEventListener('catalog-updated', refresh)
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('catalog-updated', refresh)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', refresh)
      window.clearInterval(timer)
    }
  }, [pathname, router])
  return null
}
