import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import AdminProductsClient from './AdminProductsClient'

export default async function AdminProductsPage() {
  const { data: products } = await supabase
    .from('ecommerce_products')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminProductsClient initialProducts={(products as Product[]) ?? []} />
}
