export interface Product {
  id: string
  name: string
  sku: string | null
  category: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  cost_per_item: number | null
  quantity: number
  low_stock_threshold: number
  status: 'active' | 'draft' | 'archived'
  image_url: string | null
  tags: string[] | null
  in_stock: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string | null
  user_id: string | null
  customer_id: string | null
  guest_email: string | null
  status: 'pending' | 'confirmed' | 'payment_failed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number | null
  subtotal: number
  discount_amount: number
  shipping_cost: number
  shipping_address: Record<string, string>
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string | null
  product_id: string | null
  quantity: number | null
  price: number | null
}

export type Lang = 'ar' | 'en'
