import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeClient from './HomeClient'
import { safeJsonLd } from '@/lib/json-ld'
import { dedupeProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'قهوة مختصة في قطر | دوحة روستري',
  description:
    'اشترِ القهوة المختصة في قطر من دوحة روستري: حبوب قهوة، خلطات، قهوة منزوعة الكافيين وأدوات تحضير. الشحن يبدأ من ١٠ ر.ق.',
  keywords:
    'specialty coffee Qatar, buy coffee Doha, قهوة مختصة قطر, دوحة روستري, Doha Roastery, coffee beans Qatar, Nespresso capsules Qatar, drip coffee Qatar, قهوة مختصة الدوحة, محمصة قهوة قطر, حبوب قهوة قطر',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'قهوة مختصة في قطر | دوحة روستري',
    description: 'تسوّق حبوب القهوة والخلطات والقهوة منزوعة الكافيين وأدوات التحضير من دوحة روستري في قطر.',
    url: SITE_URL,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    alternateLocale: 'en_US',
    type: 'website',
  },
}

export default async function HomePage() {
  const { data: featured } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(100)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CoffeeShop',
    name: 'Doha Roastery',
    alternateName: 'دوحة روستري',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Specialty coffee roasted fresh daily in Doha, Qatar.',
    address: { '@type': 'PostalAddress', addressLocality: 'Doha', addressCountry: 'QA' },
    telephone: '+97433337592',
    email: 'info@doharoastery.com',
    openingHours: 'Sa-Th 08:00-22:00',
    priceRange: '$$',
    servesCuisine: 'Coffee',
    sameAs: [
      'https://instagram.com/doharoastery',
      'https://twitter.com/doharoastery',
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Header />
      <HomeClient featured={dedupeProducts((featured as Product[]) ?? [])} />
      <Footer />
    </>
  )
}
