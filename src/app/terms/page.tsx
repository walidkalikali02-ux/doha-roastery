import { Metadata } from 'next'
import TermsClient from './TermsClient'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Terms & Conditions | الشروط والأحكام — دوحة روستري',
  description:
    'شروط وأحكام التسوق في دوحة روستري — قطر. سياسة الإرجاع، الشحن، الدفع، والخصوصية. Terms and conditions for shopping at Doha Roastery Qatar.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: false },
}

export default function TermsPage() {
  return <TermsClient />
}
