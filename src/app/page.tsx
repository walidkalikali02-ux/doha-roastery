import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: featured } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <>
      <Header />
      <HomeClient featured={(featured as Product[]) ?? []} />
      <Footer />
    </>
  )
}
