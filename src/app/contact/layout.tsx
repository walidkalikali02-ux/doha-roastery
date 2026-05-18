import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Doha Roastery | WhatsApp +974 6678 8898',
  description:
    'Contact Doha Roastery in Qatar via WhatsApp, email, or our contact form. We supply specialty coffee to cafés, hotels, and individuals across Qatar. Open Sat–Thu 8AM–10PM.',
  keywords:
    'contact Doha Roastery, coffee supplier Qatar, تواصل مع دوحة روستري, واتساب قهوة قطر, coffee wholesale Qatar',
  alternates: { canonical: '/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
