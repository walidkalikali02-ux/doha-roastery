import type { Metadata } from 'next'
import type { BlogLang, BlogPost } from './blog-types'
import { blogHref } from './blog-types'
import { SITE_NAME, SITE_URL, createPageMetadata } from './seo'

export function blogMetadata(post: BlogPost | null, lang: BlogLang): Metadata {
  const title = post ? post[`seo_title_${lang}`] || post[`title_${lang}`] : lang === 'ar' ? 'مجلة القهوة: أنواع الحبوب والأصناف وبلدان المنشأ' : 'Coffee journal: beans, varieties, and origins'
  const description = post ? post[`seo_description_${lang}`] || post[`excerpt_${lang}`] : lang === 'ar' ? 'استكشف عالم القهوة مع دوحة روستري: أدلة أرابيكا وروبوستا وأصناف القهوة ومناطق زراعتها، بالعربية والإنجليزية.' : 'Explore coffee species, Arabica varieties, growing regions, and practical brewing knowledge with the Doha Roastery coffee journal.'
  const path = blogHref(post?.slug ?? null, lang)
  const image = `${SITE_URL}/api/blog/og${post ? `?slug=${post.slug}` : ''}`
  const base = createPageMetadata({ title, description, path, image })
  return {
    ...base,
    alternates: { canonical: `${SITE_URL}${path}`, languages: { ar: `${SITE_URL}${blogHref(post?.slug ?? null, 'ar')}`, en: `${SITE_URL}${blogHref(post?.slug ?? null, 'en')}`, 'x-default': `${SITE_URL}${blogHref(post?.slug ?? null, 'ar')}` } },
    openGraph: {
      ...base.openGraph, type: post ? 'article' : 'website', locale: lang === 'ar' ? 'ar_QA' : 'en_US',
      alternateLocale: lang === 'ar' ? 'en_US' : 'ar_QA',
      images: [{ url: image, width: 1200, height: 630, alt: post?.title_en ?? 'Doha Roastery Coffee Journal' }],
      ...(post ? { publishedTime: post.published_at ?? undefined, modifiedTime: post.updated_at, authors: [SITE_NAME], section: post.category } : {}),
    },
  }
}

export function blogPostingJsonLd(post: BlogPost, lang: BlogLang) {
  const url = `${SITE_URL}${blogHref(post.slug, lang)}`
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }, url,
    headline: post[`title_${lang}`], description: post[`excerpt_${lang}`],
    inLanguage: lang, articleSection: post.category,
    image: [`${SITE_URL}/api/blog/og?slug=${post.slug}`],
    datePublished: post.published_at, dateModified: post.updated_at,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blog#journal`, name: 'Doha Roastery Coffee Journal' },
    citation: post.sources.map((source) => source.url),
  }
}
