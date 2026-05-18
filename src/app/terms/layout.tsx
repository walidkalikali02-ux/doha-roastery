import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Doha Roastery Qatar',
  description:
    'Read the Terms and Conditions for Doha Roastery — covering orders, shipping, returns, privacy, and wholesale partnerships in Qatar.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: false },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
