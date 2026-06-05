import { Metadata } from 'next'
import TermsClient from './TermsClient'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

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
