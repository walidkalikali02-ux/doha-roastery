import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { buildProductDescription, formatProductTitle, localizeOrigin, normalizeArabicDescription } from '@/lib/display-text'
import ProductDetailClient, { WeightVariant } from './ProductDetailClient'
import { safeJsonLd } from '@/lib/json-ld'

const SITE_URL = 'https://doha-roastery-eta.vercel.app'

function toMetaDescription(value: string) {
  if (value.length <= 160) return value
  return `${value.slice(0, 157).replace(/\s+\S*$/, '')}...`
}

/* ── SEO metadata ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { data: product } = await supabase
    .from('ecommerce_products')
    .select('name, name_ar, description, description_ar, category, price, image_url, tags, weight')
    .eq('id', id)
    .single()

  if (!product) return { title: 'Product Not Found' }

  const p = product as Pick<Product, 'name' | 'name_ar' | 'description' | 'description_ar' | 'category' | 'price' | 'image_url' | 'tags' | 'weight'>
  const nameEn = formatProductTitle({
    name: p.name,
    nameAr: p.name_ar,
    weight: p.weight,
    lang: 'en',
  })
  const nameAr = formatProductTitle({
    name: p.name,
    nameAr: p.name_ar,
    weight: p.weight,
    lang: 'ar',
  })
  const title = `${nameAr} | دوحة روستري`
  const descriptionAr = buildProductDescription({
      name: p.name,
      nameAr: p.name_ar,
      category: p.category,
      weight: p.weight,
      lang: 'ar',
      sourceDescription: p.description,
      baseDescription: p.description_ar
        ? normalizeArabicDescription(p.description_ar, p.weight)
        : null,
    })
  const descriptionEn = buildProductDescription({
      name: p.name,
      nameAr: p.name_ar,
      category: p.category,
      weight: p.weight,
      sourceDescription: p.description,
      lang: 'en',
    })
  const isCompound = Boolean(p.weight?.includes('|'))
  const origin = isCompound ? p.weight!.split('|')[0] : null

  let canonicalId = id
  if (isCompound && origin) {
    const { data: canonicalCompound } = await supabase
      .from('ecommerce_products')
      .select('id, weight')
      .eq('status', 'active')
      .eq('name', p.name)
      .order('created_at', { ascending: true })

    const matchingOrigin = (canonicalCompound as Array<{ id: string; weight: string | null }> | null)?.find(
      (item) => item.weight?.startsWith(`${origin}|`)
    )
    canonicalId = matchingOrigin?.id ?? id
  } else {
    const { data: canonical } = await supabase
      .from('ecommerce_products')
      .select('id')
      .eq('status', 'active')
      .eq('name', p.name)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    canonicalId = canonical?.id ?? id
  }

  return {
    title,
    description: toMetaDescription(descriptionAr),
    keywords: [
      p.name,
      p.name_ar ?? '',
      p.category ?? '',
      'specialty coffee Qatar',
      'buy coffee Doha',
      'قهوة مختصة قطر',
      'Doha Roastery',
      'محمصة قهوة الدوحة',
      ...(p.tags ?? []),
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description: toMetaDescription(descriptionAr),
      url: `${SITE_URL}/products/${canonicalId}`,
      siteName: 'Doha Roastery',
      images: p.image_url
        ? [{ url: p.image_url, width: 1200, height: 630, alt: nameEn }]
        : [],
      locale: 'ar_QA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: toMetaDescription(descriptionAr),
      images: p.image_url ? [p.image_url] : [],
    },
    alternates: { canonical: `${SITE_URL}/products/${canonicalId}` },
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

  const p = product as Product
  let displayProduct = p
  if (!p.image_url) {
    const { data: siblingWithImage } = await supabase
      .from('ecommerce_products')
      .select('image_url')
      .eq('name', p.name)
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .limit(1)
      .maybeSingle()

    if (siblingWithImage?.image_url) {
      displayProduct = { ...p, image_url: siblingWithImage.image_url }
    }
  }

  const displayNameEn = formatProductTitle({
    name: p.name,
    nameAr: p.name_ar,
    weight: p.weight,
    lang: 'en',
  })
  const origin = p.weight?.includes('|') ? p.weight.split('|')[0] : null
  const productDescriptionEn = buildProductDescription({
      name: p.name,
      nameAr: p.name_ar,
      category: p.category,
      weight: p.weight,
      sourceDescription: p.description,
      lang: 'en',
    })

  // Fetch all weight variants of the same product (same name, has weight column)
  let weightVariants: WeightVariant[] = []
  if (p.weight) {
    const { data: siblings } = await supabase
      .from('ecommerce_products')
      .select('id, weight, price, in_stock, quantity')
      .eq('status', 'active')
      .eq('name', p.name)
      .order('created_at', { ascending: true })

    if (siblings) {
      const allVariants = (siblings as Array<{ id: string; weight: string; price: number; in_stock: boolean; quantity: number }>)
        .filter((s) => s.weight)

      // For compound variants (Origin|Qty), only show siblings with the same origin
      const isCompound = p.weight.includes('|')
      const origin = isCompound ? p.weight.split('|')[0] : null

      const filtered = isCompound && origin
        ? allVariants.filter((s) => s.weight.startsWith(origin + '|'))
        : allVariants

      weightVariants = filtered.map((s) => ({
        id: s.id,
        weight: s.weight,
        price: Number(s.price),
        in_stock: Boolean(s.in_stock),
        quantity: Number(s.quantity),
      }))
    }

  }

  // Related products: same category, different name, exclude weight siblings
  const { data: related } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('status', 'active')
    .eq('category', p.category ?? '')
    .neq('id', id)
    .neq('name', p.name)
    .limit(4)

  /* JSON-LD */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayNameEn,
    alternateName: p.name_ar ?? undefined,
    description: productDescriptionEn,
    image: p.image_url ?? '',
    brand: { '@type': 'Brand', name: 'Doha Roastery' },
    additionalProperty: origin
      ? [{ '@type': 'PropertyValue', name: 'Origin', value: localizeOrigin(origin, 'en') }]
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'QAR',
      price: p.price,
      availability: p.in_stock
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <Header />
      <ProductDetailClient
        product={displayProduct}
        weightVariants={weightVariants}
        related={(related as Product[]) ?? []}
      />
      <Footer />
    </>
  )
}
