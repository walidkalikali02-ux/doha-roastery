import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HoneyClient from './HoneyClient'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { dedupeProducts } from '@/lib/products'
import { collectionJsonLd, SITE_URL } from '@/lib/seo'
import { safeJsonLd } from '@/lib/json-ld'

export const dynamic = 'force-dynamic'

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
    images: [{ url: '/logo.png', alt: 'Doha Roastery | دوحة روستري' }],
  },
}

export default async function HoneyPage() {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('*')
    .or('category.eq.Honey,name.ilike.*honey*,name_ar.ilike.*عسل*')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  const uniqueProducts = dedupeProducts((products as Product[]) ?? [])
  const jsonLd = collectionJsonLd(
    'منتجات العسل في قطر',
    'Carefully selected honey products with delivery across Qatar.',
    '/honey',
    uniqueProducts,
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <Header />
      <HoneyClient products={uniqueProducts} />
      <Footer />
    </>
  )
}
