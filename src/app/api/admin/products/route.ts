import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/require-admin'
import { ProductInput, ProductUpdate } from '@/lib/product-input'

function invalidateCatalog() {
  revalidatePath('/', 'layout')
}

export async function GET(request: Request) {
  const supabase = await requireAdmin(request)
  if (supabase instanceof Response) return supabase
  const { data, error } = await supabase.from('ecommerce_products').select('*').order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 503 })
  return Response.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const supabase = await requireAdmin(request)
  if (supabase instanceof Response) return supabase
  const parsed = ProductInput.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Please check the product fields and non-negative prices/quantities' }, { status: 400 })
  const { data, error } = await supabase.from('ecommerce_products').insert(parsed.data).select().single()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  invalidateCatalog()
  return Response.json({ data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await requireAdmin(request)
  if (supabase instanceof Response) return supabase
  const parsed = ProductUpdate.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Please check the product fields and reload before saving' }, { status: 400 })
  const { id, expectedUpdatedAt, changes } = parsed.data
  const { data, error } = await supabase.from('ecommerce_products')
    .update(changes).eq('id', id).eq('updated_at', expectedUpdatedAt).select().maybeSingle()
  if (error) return Response.json({ error: error.message }, { status: 400 })
  if (!data) return Response.json({ error: 'This product changed or was deleted. Refresh the list and reopen it before editing.' }, { status: 409 })
  invalidateCatalog()
  return Response.json({ data })
}

export async function DELETE(request: Request) {
  const supabase = await requireAdmin(request)
  if (supabase instanceof Response) return supabase
  const parsed = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Select between 1 and 100 products' }, { status: 400 })
  const { data, error } = await supabase.from('ecommerce_products').delete().in('id', parsed.data.ids).select('id')
  if (error) return Response.json({ error: error.message }, { status: 400 })
  invalidateCatalog()
  return Response.json({ data })
}
