import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'
import AdminOrdersClient from './AdminOrdersClient'

export default async function AdminOrdersPage() {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminOrdersClient initialOrders={(orders as Order[]) ?? []} />
}
