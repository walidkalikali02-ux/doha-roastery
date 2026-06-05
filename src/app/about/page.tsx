import { Metadata } from 'next'
import AboutClient from './AboutClient'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'About Doha Roastery | Specialty Coffee Roasted Daily in Qatar | من نحن',
  description:
    'تعرّف على دوحة روستري — محمصة قهوة مختصة في الدوحة منذ ٢٠١٨. نحمّص يومياً ونوصّل في قطر. Learn about Doha Roastery, Qatar\'s specialty coffee roaster since 2018.',
  keywords:
    'Doha Roastery about, specialty coffee roaster Qatar, قصة دوحة روستري, محمصة قهوة الدوحة, coffee roastery Doha Qatar, من نحن دوحة روستري',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Doha Roastery | Specialty Coffee Qatar',
    description: 'Qatar\'s specialty coffee roaster since 2018. Roasting fresh daily in Doha, supplying cafés, hotels, and customers across Qatar.',
    url: `${SITE_URL}/about`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default function AboutPage() {
  return <AboutClient />
}
