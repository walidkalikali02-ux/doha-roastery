import { Product } from '@/lib/types'

export function dedupeProducts(products: Product[]) {
  const byKey = new Map<string, Product>()

  for (const product of products) {
    const key = product.sku?.trim() || `${product.name.trim()}|${product.weight ?? ''}`
    const existing = byKey.get(key)
    if (!existing || (!existing.image_url && product.image_url)) {
      byKey.set(key, product)
    }
  }

  return [...byKey.values()]
}
