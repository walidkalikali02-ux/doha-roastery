import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductDetailClient from './ProductDetailClient'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: product } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const { data: related } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active')
    .eq('category', (product as Product).category ?? '')
    .neq('id', id)
    .limit(4)

  return (
    <>
      <Header />
      <ProductDetailClient product={product as Product} related={(related as Product[]) ?? []} />
      <Footer />
    </>
  )
}
