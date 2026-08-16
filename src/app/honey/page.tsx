import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HoneyClient from './HoneyClient'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { dedupeProducts } from '@/lib/products'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'العسل | Honey في قطر — دوحة روستري',
  description: 'تسوّق منتجات العسل المختارة بعناية مع توصيل داخل قطر من دوحة روستري.',
  alternates: { canonical: `${SITE_URL}/honey` },
  openGraph: {
    title: 'العسل | Honey — دوحة روستري',
    description: 'Discover carefully selected honey products with delivery across Qatar.',
    url: `${SITE_URL}/honey`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default async function HoneyPage() {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('*')
    .or('category.eq.Honey,name.ilike.*honey*,name_ar.ilike.*عسل*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header />
      <HoneyClient products={dedupeProducts((products as Product[]) ?? [])} />
      <Footer />
    </>
  )
}
