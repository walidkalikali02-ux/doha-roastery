import type { CartItem } from '@/contexts/CartContext'

export type CartProduct = {
  id: string
  name: string
  name_ar: string | null
  price: number
  image_url: string | null
  weight: string | null
  in_stock: boolean
  quantity: number
}

export function reconcileCartProducts(items: CartItem[], products: CartProduct[], requestedIds = items.map((item) => item.id)) {
  const byId = new Map(products.map((product) => [product.id, product]))
  const requested = new Set(requestedIds)
  return items.map((item) => {
    if (!requested.has(item.id)) return item
    const product = byId.get(item.id)
    if (!product) return { ...item, available: false, stockQuantity: 0 }
    return {
      ...item,
      name: product.name,
      nameAr: product.name_ar,
      price: Number(product.price),
      image_url: product.image_url,
      weight: product.weight ?? '',
      available: product.in_stock && product.quantity > 0,
      stockQuantity: product.quantity,
    }
  })
}
