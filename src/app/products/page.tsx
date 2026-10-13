import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductsClient from './ProductsClient'
import { dedupeProducts } from '@/lib/products'
import { collectionJsonLd, SITE_URL } from '@/lib/seo'
import { safeJsonLd } from '@/lib/json-ld'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'شراء قهوة مختصة في قطر | دوحة روستري',
  description:
    'تسوّق حبوب القهوة والخلطات والقهوة منزوعة الكافيين وأدوات التحضير في قطر. الشحن يبدأ من ١٠ ر.ق.',
  keywords:
    'buy coffee Qatar, specialty coffee beans Doha, Nespresso capsules Qatar, drip coffee Qatar, قهوة مختصة قطر, حبوب قهوة الدوحة, كبسولات نسبريسو قطر, أكياس دريب قطر, قهوة إثيوبيا قطر, قهوة كولومبيا قطر, قهوة البرازيل قطر',
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    title: 'شراء قهوة مختصة في قطر | دوحة روستري',
    description: 'Shop specialty coffee beans, blends, decaf coffee and brewing tools in Qatar. Shipping starts at 10 QAR.',
    url: `${SITE_URL}/products`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
    images: [{ url: '/logo.png', alt: 'Doha Roastery | دوحة روستري' }],
  },
}

export default async function ProductsPage() {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const uniqueProducts = dedupeProducts((products as Product[]) ?? [])
  const categories: string[] = Array.from(
    new Set(uniqueProducts.map((p) => p.category).filter(Boolean))
  ) as string[]
  const jsonLd = collectionJsonLd(
    'قهوة مختصة وأدوات التحضير في قطر',
    'Specialty coffee beans, blends, capsules, drip coffee, and brewing equipment delivered across Qatar.',
    '/products',
    uniqueProducts,
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Header />
      <ProductsClient products={uniqueProducts} categories={categories} />
      <Footer />
    </>
  )
}
