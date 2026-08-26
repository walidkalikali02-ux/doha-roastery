import { supabase } from '@/lib/supabase'
import { Order } from '@/lib/types'

export interface DailyOrderMetric {
  date: string
  label: string
  orders: number
  revenue: number
}

export interface StatusMetric {
  status: Order['status']
  count: number
}

export interface AdminOrdersOverview {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  recentOrders: Order[]
  avgOrderValue: number
  todayOrders: number
  todayRevenue: number
  deliveredRate: number
  last7Days: DailyOrderMetric[]
  statusBreakdown: StatusMetric[]
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
    { data: allOrdersData },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('total').eq('status', 'delivered'),
    supabase.from('orders').select('id, status, total, created_at').order('created_at', { ascending: true }),
  ])

  const allOrders = ((allOrdersData as Pick<Order, 'id' | 'status' | 'total' | 'created_at'>[]) ?? []).map((order) => ({
    ...order,
    total: order.total ?? 0,
  }))
  const totalRevenue = (revenueData ?? []).reduce((sum, order) => sum + (order.total ?? 0), 0)
  const totalOrdersCount = totalOrders ?? 0
  const avgOrderValue = totalOrdersCount > 0 ? allOrders.reduce((sum, order) => sum + order.total, 0) / totalOrdersCount : 0

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayOrdersList = allOrders.filter((order) => order.created_at.slice(0, 10) === todayKey)
  const todayOrders = todayOrdersList.length
  const todayRevenue = todayOrdersList.reduce((sum, order) => sum + order.total, 0)

  const deliveredOrders = allOrders.filter((order) => order.status === 'delivered').length
  const deliveredRate = totalOrdersCount > 0 ? (deliveredOrders / totalOrdersCount) * 100 : 0

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))

    const key = date.toISOString().slice(0, 10)
    const dayOrders = allOrders.filter((order) => order.created_at.slice(0, 10) === key)

    return {
      date: key,
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
    }
  })

  const statusSequence: Order['status'][] = [
    'pending',
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'payment_failed',
  ]

  const statusBreakdown = statusSequence
    .map((status) => ({
      status,
      count: allOrders.filter((order) => order.status === status).length,
    }))
    .filter((item) => item.count > 0)

  return {
    totalOrders: totalOrdersCount,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    recentOrders: (recentOrders as Order[]) ?? [],
    avgOrderValue,
    todayOrders,
    todayRevenue,
    deliveredRate,
    last7Days,
    statusBreakdown,
  }
}
