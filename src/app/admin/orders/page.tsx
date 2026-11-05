import AdminOrdersClient from './AdminOrdersClient'
import { privatePageMetadata } from '@/lib/seo'

export const metadata = privatePageMetadata

export const dynamic = 'force-dynamic'

export default function AdminOrdersPage() {
  return <AdminOrdersClient initialOrders={[]} />
}
