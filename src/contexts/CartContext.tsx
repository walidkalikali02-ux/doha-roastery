'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
  cartKey: string      // unique key: `${id}-${grind}`
  id: string           // actual Supabase product ID
  name: string         // base product name (no weight suffix)
  weight: string       // e.g. "250g", "" for non-weight products
  grind: string        // "whole-bean" | "espresso" | "filter" | "moka" | "french-press" | ""
  notes: string
  price: number
  image_url: string | null
  quantity: number
}

interface AddItemInput {
  id: string
  name: string
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
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clear: () => {},
  total: 0,
  count: 0,
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('doha_cart_v2')
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem('doha_cart_v2', JSON.stringify(items))
  }, [items, ready])

  function addItem(item: AddItemInput) {
    const cartKey = `${item.id}-${item.grind}`
    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey)
      if (existing) {
        return prev.map((i) =>
          i.cartKey === cartKey
            ? { ...i, quantity: i.quantity + 1, notes: item.notes || i.notes }
            : i
        )
      }
      return [...prev, { ...item, cartKey, quantity: 1 }]
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
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
