import { privatePageMetadata } from '@/lib/seo'
import SalesReportClient from './SalesReportClient'

export const metadata = privatePageMetadata
export default function SalesReportsPage() {
  return <SalesReportClient />
}
