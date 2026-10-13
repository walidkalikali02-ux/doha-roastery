import AdminAccountsClient from './AdminAccountsClient'
import { privatePageMetadata } from '@/lib/seo'

export const metadata = privatePageMetadata

export default function AdminAccountsPage() {
  return <AdminAccountsClient />
}
