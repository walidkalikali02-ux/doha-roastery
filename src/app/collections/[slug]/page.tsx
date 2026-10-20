import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { COLLECTIONS, getCollection } from '@/lib/collections'
import { dedupeProducts } from '@/lib/products'
import { SITE_URL } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import CollectionClient from './CollectionClient'

export const dynamic = 'force-dynamic'
export const dynamicParams = false

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return COLLECTIONS.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) return {}

  return {
    title: `${collection.ar} | دوحة روستري`,
    description: collection.descriptionAr,
    alternates: { canonical: `${SITE_URL}/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.ar} | دوحة روستري`,
      description: collection.descriptionAr,
      url: `${SITE_URL}/collections/${collection.slug}`,
      siteName: 'Doha Roastery',
      locale: 'ar_QA',
      type: 'website',
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) notFound()

  const { data } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })

  const products = dedupeProducts((data as Product[]) ?? []).filter((product) => {
    const searchable = [
      product.name,
      product.name_ar,
      product.category,
      product.description,
      product.description_ar,
      ...(product.tags ?? []),
    ].filter(Boolean).join(' ').toLocaleLowerCase()

    const matches = collection.keywords.some((keyword) => searchable.includes(keyword.toLocaleLowerCase()))
    if (collection.slug === 'boxed-chocolate') {
      return matches && ['box', 'boxed', 'علب', 'علبة'].some((keyword) => searchable.includes(keyword))
    }
    if (collection.slug === 'chocolate-by-weight') {
      return matches && !['box', 'boxed', 'علب', 'علبة'].some((keyword) => searchable.includes(keyword))
    }
    return matches
  })

  return (
    <>
      <Header />
      <CollectionClient collection={collection} products={products} />
      <Footer />
    </>
  )
}
