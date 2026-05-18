import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductDetailClient from './ProductDetailClient'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'
const BRAND = 'Doha Roastery | Qatar'

/* ── SEO metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { data: product } = await supabase
    .from('ecommerce_products')
    .select('name, description, category, price, image_url, tags')
    .eq('id', id)
    .single()

  if (!product) return { title: 'Product Not Found' }

  const p = product as Pick<Product, 'name' | 'description' | 'category' | 'price' | 'image_url' | 'tags'>
  const title = `${p.name} | Buy in Qatar | ${BRAND}`
  const description = p.description
    ?? `Buy ${p.name} in Qatar. Freshly roasted specialty coffee at Doha Roastery. Free delivery over 200 QAR.`

  return {
    title,
    description,
    keywords: [
      p.name,
      p.category ?? '',
      'specialty coffee Qatar',
      'buy coffee Doha',
      'قهوة مختصة قطر',
      'Doha Roastery',
      ...(p.tags ?? []),
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/products/${id}`,
      siteName: 'Doha Roastery',
      images: p.image_url
        ? [{ url: p.image_url, width: 1200, height: 630, alt: p.name }]
        : [],
      locale: 'ar_QA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: p.image_url ? [p.image_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/products/${id}` },
  }
}

/* ── Page ── */
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

  /* JSON-LD structured data for Google rich results */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: (product as Product).name,
    description: (product as Product).description ?? '',
    image: (product as Product).image_url ?? '',
    brand: { '@type': 'Brand', name: 'Doha Roastery' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'QAR',
      price: (product as Product).price,
      availability: (product as Product).in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Doha Roastery' },
      url: `${SITE_URL}/products/${id}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <ProductDetailClient product={product as Product} related={(related as Product[]) ?? []} />
      <Footer />
    </>
  )
}
