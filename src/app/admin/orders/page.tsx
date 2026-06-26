import { fetchAdminOrders } from '@/lib/admin-orders'
import AdminOrdersClient from './AdminOrdersClient'

export default async function AdminOrdersPage() {
  const orders = await fetchAdminOrders()

  return <AdminOrdersClient initialOrders={orders} />
}
