import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop Specialty Coffee Qatar — Coffee Beans, Capsules & Drip Pouches',
  description:
    'Browse our full range of specialty coffee beans, Nespresso-compatible capsules, drip pouches, and tea. All freshly roasted daily at Doha Roastery in Qatar. Free delivery over 200 QAR.',
  keywords:
    'buy coffee Qatar, specialty coffee beans Doha, Nespresso capsules Qatar, drip coffee pouches Qatar, قهوة مختصة قطر, حبوب قهوة الدوحة',
  alternates: { canonical: '/products' },
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
