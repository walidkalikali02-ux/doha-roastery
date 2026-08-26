import { Metadata } from 'next'
import AboutClient from './AboutClient'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'عن دوحة روستري | محمصة قهوة مختصة في الدوحة',
  description:
    'تعرّف على دوحة روستري، محمصة قهوة مختصة في الدوحة منذ ٢٠١٧، ونكتشف كيف نختار ونحمّص القهوة ونوصلها في قطر.',
  keywords:
    'Doha Roastery about, specialty coffee roaster Qatar, قصة دوحة روستري, محمصة قهوة الدوحة, coffee roastery Doha Qatar, من نحن دوحة روستري',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'عن دوحة روستري | قهوة مختصة في قطر',
    description: 'Learn about Doha Roastery, a specialty coffee roaster in Doha since 2017, supplying cafés, hotels and customers across Qatar.',
    url: `${SITE_URL}/about`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default function AboutPage() {
  return <AboutClient />
}
