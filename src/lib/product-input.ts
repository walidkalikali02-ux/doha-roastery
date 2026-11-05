import { z } from 'zod'

const text = z.string().max(20_000).nullable()
export const ProductInput = z.object({
  name: z.string().trim().min(1).max(500),
  name_ar: text,
  sku: z.string().trim().max(200).nullable(),
  category: z.string().trim().max(200).nullable(),
  description: text,
  description_ar: text,
  price: z.number().finite().nonnegative(),
  compare_at_price: z.number().finite().nonnegative().nullable(),
  cost_per_item: z.number().finite().nonnegative().nullable(),
  quantity: z.number().int().nonnegative(),
  low_stock_threshold: z.number().int().nonnegative(),
  status: z.enum(['active', 'draft', 'archived']),
  image_url: text,
  tags: z.array(z.string().max(200)).max(100).nullable(),
  in_stock: z.boolean(),
  weight: z.string().trim().max(200).nullable(),
})

export const ProductUpdate = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().min(1),
  changes: ProductInput.partial().strict().refine((value) => Object.keys(value).length > 0),
})
