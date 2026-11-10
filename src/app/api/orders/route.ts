import { createClient } from '@supabase/supabase-js'
import { after } from 'next/server'
import { z } from 'zod'
import { sendOrderEmails } from '@/lib/send-order-emails'

export const maxDuration = 60

const Schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  shippingAddress: z.object({
    first_name: z.string().trim().min(1).max(200),
    last_name: z.string().max(200),
    phone: z.string().trim().min(1).max(50),
    address: z.string().trim().min(1).max(2000),
    city: z.string().max(200),
    area: z.string().max(200),
    notes: z.string().max(4000),
    shipping_zone: z.enum(['doha', 'qatar', 'gcc']),
    payment_method: z.enum(['cod', 'card']),
  }),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive().max(1000),
    weight: z.string().max(100).nullable(),
    grind: z.string().max(100).nullable(),
    notes: z.string().trim().max(1000).optional().default(''),
  })).min(1).max(100),
})

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Please check your order details' }, { status: 400 })
  }

  // Use the customer's token (or anon key), not the service role: place_order
  // still computes prices and associates auth.uid() with signed-in customers.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: request.headers.get('authorization') ?? `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` } },
    },
  )
  const { data, error } = await supabase.rpc('place_order', {
    p_guest_email: parsed.data.email,
    p_shipping_address: parsed.data.shippingAddress,
    p_items: parsed.data.items,
  })
  if (error || !data) {
    console.error('Order creation failed', error)
    return Response.json({ error: error?.message ?? 'Could not create order' }, { status: 400 })
  }

  const order = data as { order_id: string; order_number: string }
  // Register server-side before returning. Card redirects and closed tabs no
  // longer prevent notification; cron recovers if this invocation is interrupted.
  after(async () => {
    try {
      const result = await sendOrderEmails(order.order_id)
      if (result.customerEmailError || result.adminEmailError) {
        console.error('Order email pending recovery', { orderId: order.order_id, ...result })
      }
    } catch (error) {
      console.error('Order email pending recovery', { orderId: order.order_id, error })
    }
  })

  return Response.json(order, { status: 201 })
}
