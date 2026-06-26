import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ToolsClient from './ToolsClient'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

export const metadata: Metadata = {
  title: 'Coffee Tools & Equipment Qatar | أدوات القهوة — دوحة روستري',
  description:
    'تسوّق أدوات وأجهزة القهوة في قطر. كل ما تحتاجه لتحضير قهوة مثالية في المنزل أو المقهى. Shop coffee tools and equipment in Qatar.',
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    title: 'Coffee Tools & Equipment | دوحة روستري',
    description: 'Shop coffee tools and equipment in Qatar — Doha Roastery.',
    url: `${SITE_URL}/tools`,
    siteName: 'Doha Roastery',
    locale: 'ar_QA',
    type: 'website',
  },
}

export default async function ToolsPage() {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('category', 'Tools')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })

  return (
    <>
      <Header />
      <ToolsClient products={(products as Product[]) ?? []} />
      <Footer />
    </>
  )
}
