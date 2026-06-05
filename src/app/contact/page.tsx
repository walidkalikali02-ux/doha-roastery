import { Metadata } from 'next'
import ContactClient from './ContactClient'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'Contact Doha Roastery | WhatsApp & Email | تواصل معنا',
  description:
    'تواصل مع دوحة روستري — واتساب: ‎+974 6678 8898، البريد: info@doharoastery.com. الدوحة، قطر. مفتوح السبت–الخميس ٨ص–١٠م. Contact us via WhatsApp, email, or our form.',
  keywords:
    'contact Doha Roastery, تواصل دوحة روستري, واتساب دوحة روستري, coffee Qatar contact, Doha coffee shop contact, +974 6678 8898',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact Doha Roastery | تواصل معنا',
    description: 'WhatsApp: +974 6678 8898 · Email: info@doharoastery.com · Doha, Qatar · Open Sat–Thu 8AM–10PM',
    url: `${SITE_URL}/contact`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default function ContactPage() {
  return <ContactClient />
}
