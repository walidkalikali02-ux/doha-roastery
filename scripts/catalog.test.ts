import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reconcileCartProducts } from '../src/lib/cart-products'
import { ProductUpdate } from '../src/lib/product-input'
import type { CartItem } from '../src/contexts/CartContext'

const item: CartItem = {
  id: '00271bf7-19bd-4336-9bf4-994196edf44f', cartKey: 'coffee-filter',
  name: 'Old name', nameAr: 'قديم', weight: '100g', grind: 'filter',
  notes: 'Customer note', price: 15, image_url: '/old.jpg', quantity: 2,
}
const current = {
  id: item.id, name: 'Updated coffee', name_ar: 'قهوة جديدة', price: 27.75,
  weight: '250g', image_url: '/new.jpg', in_stock: true, quantity: 10,
}

test('stored carts refresh editable product data while preserving customer choices', () => {
  const [updated] = reconcileCartProducts([item], [current])
  assert.equal(updated.price, 27.75)
  assert.equal(updated.name, current.name)
  assert.equal(updated.nameAr, current.name_ar)
  assert.equal(updated.weight, current.weight)
  assert.equal(updated.image_url, current.image_url)
  assert.equal(updated.quantity, 2)
  assert.equal(updated.grind, 'filter')
  assert.equal(updated.notes, 'Customer note')
  assert.equal(updated.available, true)
})

test('deleted or unpublished products remain visible in cart as unavailable', () => {
  const [updated] = reconcileCartProducts([item], [])
  assert.equal(updated.available, false)
  assert.equal(updated.stockQuantity, 0)
  assert.equal(updated.quantity, 2)
})

test('in-flight refresh does not invalidate products added after the request started', () => {
  const newer = { ...item, id: 'f4c4705b-16d3-4e78-8820-565f0565a17f', cartKey: 'new' }
  const next = reconcileCartProducts([item, newer], [current], [item.id])
  assert.equal(next[0].price, current.price)
  assert.deepEqual(next[1], newer)
})

test('product patches preserve explicit nulls, zero prices, and false stock values', () => {
  const parsed = ProductUpdate.parse({
    id: item.id, expectedUpdatedAt: '2026-10-25T17:00:00Z',
    changes: { price: 0, compare_at_price: null, in_stock: false },
  })
  assert.deepEqual(parsed.changes, { price: 0, compare_at_price: null, in_stock: false })
})

test('product patches reject stale-form payloads without a version and invalid prices', () => {
  assert.equal(ProductUpdate.safeParse({ id: item.id, changes: { price: 40 } }).success, false)
  assert.equal(ProductUpdate.safeParse({ id: item.id, expectedUpdatedAt: 'version', changes: { price: -10 } }).success, false)
  assert.equal(ProductUpdate.safeParse({ id: item.id, expectedUpdatedAt: 'version', changes: {} }).success, false)
})
