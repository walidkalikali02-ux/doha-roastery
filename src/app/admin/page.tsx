import type { ComponentProps } from 'react'
import { fetchAdminOrdersOverview } from '@/lib/admin-orders'
import { supabase } from '@/lib/supabase'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const [{ count: totalProducts }, orderOverview] = await Promise.all([
    supabase.from('ecommerce_products').select('*', { count: 'exact', head: true }),
    fetchAdminOrdersOverview(),
  ])

  const stats: ComponentProps<typeof AdminDashboardClient>['stats'] = {
    totalProducts: totalProducts ?? 0,
    totalOrders: orderOverview.totalOrders,
    totalRevenue: orderOverview.totalRevenue,
    pendingOrders: orderOverview.pendingOrders,
  }

  return <AdminDashboardClient stats={stats} recentOrders={orderOverview.recentOrders} />
}
