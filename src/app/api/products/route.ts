import { z } from 'zod'
import { supabasePublic } from '@/lib/supabase-public'

export async function GET(request: Request) {
  const parsed = z.array(z.string().uuid()).min(1).max(100).safeParse(
    new URL(request.url).searchParams.get('ids')?.split(',') ?? [],
  )
  if (!parsed.success) return Response.json({ error: 'Valid product IDs are required' }, { status: 400 })
  const { data, error } = await supabasePublic.from('ecommerce_products')
    .select('id, name, name_ar, price, image_url, weight, in_stock, quantity')
    .eq('status', 'active').in('id', parsed.data)
  if (error) return Response.json({ error: 'Could not refresh product prices' }, { status: 503 })
  return Response.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
}
