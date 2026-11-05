import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'

export async function GET(request: NextRequest) {
  const supabase = await requireAdmin(request)
  if (supabase instanceof Response) return supabase
  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 503 })
    return Response.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  const { data, error } = await supabase
    .from('order_items')
    .select('id, product_name, variant_name, sku, quantity, unit_price, total_price')
    .eq('order_id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function PATCH(request: NextRequest) {
  const authorized = await requireAdmin(request)
  if (authorized instanceof Response) return authorized
  const body = await request.json().catch(() => null)
  const { id, status } = body ?? {}

  if (!id || !status) {
    return Response.json({ error: 'Missing id or status' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}
