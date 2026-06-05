import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'Shop Specialty Coffee Qatar | حبوب قهوة، كبسولات ودريب — دوحة روستري',
  description:
    'تسوّق قهوة مختصة في قطر — حبوب أحادية المصدر من البرازيل وإثيوبيا وكولومبيا والمزيد. كبسولات نسبريسو، أكياس دريب، قهوة تركية وقطرية. توصيل مجاني فوق ٢٠٠ ر.ق. Shop specialty coffee beans, Nespresso capsules, drip pouches & tea. Free delivery over 200 QAR.',
  keywords:
    'buy coffee Qatar, specialty coffee beans Doha, Nespresso capsules Qatar, drip coffee Qatar, قهوة مختصة قطر, حبوب قهوة الدوحة, كبسولات نسبريسو قطر, أكياس دريب قطر, قهوة إثيوبيا قطر, قهوة كولومبيا قطر, قهوة برازيل قطر',
  alternates: { canonical: `${SITE_URL}/products` },
  openGraph: {
    title: 'Shop Specialty Coffee Qatar | دوحة روستري',
    description: 'Single-origin beans, Nespresso capsules, drip pouches & tea — all freshly roasted daily in Doha. Free delivery over 200 QAR.',
    url: `${SITE_URL}/products`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default async function ProductsPage() {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const categories: string[] = Array.from(
    new Set((products ?? []).map((p: Product) => p.category).filter(Boolean))
  ) as string[]

  return (
    <>
      <Header />
      <ProductsClient products={(products as Product[]) ?? []} categories={categories} />
      <Footer />
    </>
  )
}
