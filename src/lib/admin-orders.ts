import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'

export interface AdminOrdersOverview {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  recentOrders: Order[]
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return (data as Order[]) ?? []
}

export async function fetchAdminOrdersOverview(): Promise<AdminOrdersOverview> {
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { data: recentOrders },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('total').eq('status', 'delivered'),
  ])

  const totalRevenue = (revenueData ?? []).reduce((sum, order) => sum + (order.total ?? 0), 0)

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    recentOrders: (recentOrders as Order[]) ?? [],
  }
}
