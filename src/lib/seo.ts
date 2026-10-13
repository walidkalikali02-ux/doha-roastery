import type { Metadata } from 'next'

export const SITE_NAME = 'Doha Roastery'
export const SITE_NAME_AR = 'دوحة روستري'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.doharoastery.com').replace(/\/$/, '')
export const DEFAULT_OG_IMAGE = '/logo.png'

type PageMetadata = {
  title: string
  description: string
  path: string
  keywords?: string[]
  image?: string
  index?: boolean
  follow?: boolean
}

export function createPageMetadata({ title, description, path, keywords = [], image = DEFAULT_OG_IMAGE, index = true, follow = true }: PageMetadata): Metadata {
  const canonical = path === '/' ? SITE_URL : `${SITE_URL}${path}`
  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: { index, follow, googleBot: { index, follow } },
    openGraph: {
      type: 'website', locale: 'ar_QA', alternateLocale: 'en_US', url: canonical,
      siteName: SITE_NAME, title, description,
      images: [{ url: image, alt: `${SITE_NAME} | ${SITE_NAME_AR}` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export const privatePageMetadata: Metadata = {
  title: 'Doha Roastery',
  robots: {
    index: false, follow: false, noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name,
      item: item.path === '/' ? SITE_URL : `${SITE_URL}${item.path}`,
    })),
  }
}

type CatalogItem = {
  id: string
  name: string
  name_ar?: string | null
  image_url?: string | null
  price: number
  in_stock: boolean
}

export function collectionJsonLd(name: string, description: string, path: string, products: CatalogItem[]) {
  const url = `${SITE_URL}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}/#collection`,
    name,
    description,
    url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/products/${product.id}`,
        item: {
          '@type': 'Product',
          name: product.name,
          alternateName: product.name_ar ?? undefined,
          image: product.image_url ?? undefined,
          brand: { '@type': 'Brand', name: SITE_NAME },
          offers: {
            '@type': 'Offer', price: product.price, priceCurrency: 'QAR',
            availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/products/${product.id}`,
          },
        },
      })),
    },
  }
}
