import { supabase } from '@/lib/supabase'

export async function adminFetch(path: string, init: RequestInit = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) throw new Error('Please sign in again')
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.access_token}`)
  if (init.body) headers.set('Content-Type', 'application/json')
  return fetch(path, { ...init, headers, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(20_000) })
}

export function notifyCatalogChanged() {
  try { localStorage.setItem('doha_catalog_updated', String(Date.now())) } catch {}
  window.dispatchEvent(new Event('catalog-updated'))
}
