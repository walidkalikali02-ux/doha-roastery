import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductsClient from './ProductsClient'

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
