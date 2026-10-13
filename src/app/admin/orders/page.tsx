import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Order } from '@/lib/types'
import AdminOrdersClient from './AdminOrdersClient'
import { privatePageMetadata } from '@/lib/seo'

export const metadata = privatePageMetadata

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminOrdersClient initialOrders={(data as Order[]) ?? []} />
}
