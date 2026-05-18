import { supabase } from '@/lib/supabase'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const [{ count: totalProducts }, { count: totalOrders }, { data: recentOrders }] = await Promise.all([
    supabase.from('ecommerce_products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'delivered')

  const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0)

  return (
    <AdminDashboardClient
      stats={{ totalProducts: totalProducts ?? 0, totalOrders: totalOrders ?? 0, totalRevenue }}
      recentOrders={recentOrders ?? []}
    />
  )
}
