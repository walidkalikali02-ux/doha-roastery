'use client'
import { createContext, useCallback, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { reconcileCartProducts } from '@/lib/cart-products'

export interface CartItem {
  cartKey: string      // unique key: `${id}-${grind}`
  id: string           // actual Supabase product ID
  name: string         // base product name (no weight suffix)
  nameAr?: string | null
  weight: string       // e.g. "250g", "" for non-weight products
  grind: string        // "whole-bean" | "espresso" | "filter" | "moka" | "french-press" | ""
  notes: string
  price: number
  image_url: string | null
  quantity: number
  available?: boolean
  stockQuantity?: number
}

interface AddItemInput {
  id: string
  name: string
  nameAr?: string | null
  weight: string
  grind: string
  notes: string
  price: number
  image_url: string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: AddItemInput) => void
  removeItem: (cartKey: string) => void
  updateQty: (cartKey: string, qty: number) => void
  clear: () => void
  total: number
  count: number
  syncProducts: () => Promise<{ changed: boolean; unavailable: boolean }>
  syncing: boolean
  syncError: string | null
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  total: 0,
  count: 0,
  syncProducts: async () => ({ changed: false, unavailable: false }),
  syncing: false,
  syncError: null,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const itemsRef = useRef(items)
  const syncVersion = useRef(0)

  useEffect(() => { itemsRef.current = items }, [items])

  const syncProducts = useCallback(async () => {
    const ids = [...new Set(itemsRef.current.map((item) => item.id))]
    const version = ++syncVersion.current
    if (!ids.length) {
      setSyncing(false)
      setSyncError(null)
      return { changed: false, unavailable: false }
    }
    setSyncing(true)
    try {
      const response = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`, { cache: 'no-store', signal: AbortSignal.timeout(15_000) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? 'Could not refresh prices')
      if (version !== syncVersion.current) throw new Error('Product refresh superseded; please retry')
      const before = itemsRef.current
      const next = reconcileCartProducts(before, json.data, ids)
      const changed = before.some((item, i) => item.price !== next[i].price)
      setItems((prev) => reconcileCartProducts(prev, json.data, ids))
      setSyncError(null)
      return { changed, unavailable: next.some((item) => item.available === false || (item.stockQuantity != null && item.quantity > item.stockQuantity)) }
    } catch (e) {
      if (version === syncVersion.current) setSyncError(e instanceof Error ? e.message : String(e))
      throw e
    } finally {
      if (version === syncVersion.current) setSyncing(false)
    }
  }, [])

  const productIds = [...new Set(items.map((item) => item.id))].sort().join(',')
  useEffect(() => {
    if (!ready) return
    const refresh = () => { if (document.visibilityState === 'visible') void syncProducts().catch(() => {}) }
    const onStorage = (event: StorageEvent) => { if (event.key === 'doha_catalog_updated') refresh() }
    refresh()
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
  }, [ready, productIds, syncProducts])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem('doha_cart_v2') ?? '[]')
        if (Array.isArray(stored)) setItems(stored.filter((item) =>
          typeof item.id === 'string' && typeof item.cartKey === 'string' && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0
        ))
      } catch {}
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem('doha_cart_v2', JSON.stringify(items))
  }, [items, ready])

  function addItem(item: AddItemInput) {
    // Different notes for the same product must remain separate order lines.
    const note = item.notes.trim()
    const cartKey = `${item.id}-${item.grind}${note ? `-${encodeURIComponent(note)}` : ''}`
    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey)
      const normalizedItem = { ...item, notes: note }
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey
            ? { ...i, ...normalizedItem, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...normalizedItem, cartKey, quantity: 1 }]
    })
  }

  function removeItem(cartKey: string) {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey))
  }

  function updateQty(cartKey: string, qty: number) {
    if (qty < 1) { removeItem(cartKey); return }
    setItems((prev) => prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: qty } : i))
  }

  function clear() { setItems([]) }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total, count, syncProducts, syncing, syncError }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
