import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BlogCard from '@/components/BlogCard'
import BlogLocale from '@/components/BlogLocale'
import { getPublishedPosts } from '@/lib/blog'
import { BLOG_CATEGORIES, BLOG_LABELS, blogHref, type BlogLang } from '@/lib/blog-types'
import { blogMetadata } from '@/lib/blog-seo'
import { safeJsonLd } from '@/lib/json-ld'
import { SITE_URL, breadcrumbJsonLd } from '@/lib/seo'

type Props = { searchParams: Promise<{ lang?: string; category?: string; q?: string }> }
export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams
  const metadata = blogMetadata(null, params.lang === 'en' ? 'en' : 'ar')
  // Filter/search pages canonicalise to the journal, rather than competing with it.
  if (params.q || params.category) metadata.robots = { index: false, follow: true }
  return metadata
}
export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams
  const lang: BlogLang = params.lang === 'en' ? 'en' : 'ar'
  const ar = lang === 'ar'
  const posts = await getPublishedPosts()
  const category = BLOG_CATEGORIES.find((value) => value === params.category)
  const query = (params.q ?? '').trim().slice(0, 120)
  const visible = posts.filter((post) => (!category || post.category === category) && (!query || `${post.title_ar} ${post.title_en} ${post.excerpt_ar} ${post.excerpt_en}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())))
  const featured = !category && !query ? visible.find((post) => post.slug === 'world-coffee-beans-guide') ?? visible[0] : null
  const rest = featured ? visible.filter((post) => post.slug !== featured.slug) : visible
  const filterHref = (value?: string) => `/blog?${new URLSearchParams({ ...(lang === 'en' ? { lang } : {}), ...(value ? { category: value } : {}), ...(query ? { q: query } : {}) })}`
  const structured = {
    '@context': 'https://schema.org', '@type': 'Blog', '@id': `${SITE_URL}/blog#journal`,
    name: ar ? 'مجلة القهوة — دوحة روستري' : 'Doha Roastery Coffee Journal', url: `${SITE_URL}${blogHref(null, lang)}`, inLanguage: lang,
    blogPost: visible.map((post) => ({ '@type': 'BlogPosting', headline: post[`title_${lang}`], url: `${SITE_URL}${blogHref(post.slug, lang)}` })),
  }
  return <div className="flex min-h-screen flex-col"><BlogLocale lang={lang} /><Header />
    <main dir={ar ? 'rtl' : 'ltr'} lang={lang} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structured) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd([{ name: ar ? 'الرئيسية' : 'Home', path: '/' }, { name: ar ? 'مجلة القهوة' : 'Coffee journal', path: blogHref(null, lang) }])) }} />
      <div className="mb-10 flex items-center justify-between border-b border-sand/40 pb-4 text-xs tracking-widest text-terracotta"><span>DOHA ROASTERY / {ar ? 'معرفة القهوة' : 'COFFEE KNOWLEDGE'}</span><Link href={blogHref(null, ar ? 'en' : 'ar')} hrefLang={ar ? 'en' : 'ar'} className="min-h-11 content-center px-2 text-charcoal underline underline-offset-4">{ar ? 'English' : 'العربية'}</Link></div>
      <div className="mb-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16">
        <h1 className="text-4xl font-light leading-[1.4] sm:text-6xl">{ar ? <>لكل حبّة،<br /><span className="text-terracotta">حكاية تستحق المعرفة.</span></> : <>Every bean.<br /><span className="text-terracotta">A story worth knowing.</span></>}</h1>
        <p className="max-w-lg text-base leading-[1.9] text-charcoal/65">{ar ? 'مجلة القهوة من دوحة روستري. رحلة بين الأنواع والأصناف وبلدان المنشأ، لفهم ما في فنجانك واختيار قهوتك بثقة.' : 'The Doha Roastery coffee journal. A considered guide to species, varieties, and origins—so you can understand your cup and choose with confidence.'}</p>
      </div>
      <div className="mb-10 flex flex-col justify-between gap-6 border-y border-sand/40 py-4 lg:flex-row lg:items-center">
        <nav aria-label={ar ? 'تصنيفات المقالات' : 'Article categories'} className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href={filterHref()} aria-current={!category ? 'page' : undefined} className={`min-h-11 content-center border-b-2 ${!category ? 'border-terracotta text-terracotta' : 'border-transparent'}`}>{ar ? 'كل المقالات' : 'All stories'}</Link>
          {BLOG_CATEGORIES.map((value) => <Link key={value} href={filterHref(value)} aria-current={category === value ? 'page' : undefined} className={`min-h-11 content-center border-b-2 ${category === value ? 'border-terracotta text-terracotta' : 'border-transparent hover:text-terracotta'}`}>{BLOG_LABELS[value][lang]}</Link>)}
        </nav>
        <form action="/blog" className="flex gap-2">{lang === 'en' && <input type="hidden" name="lang" value="en" />}{category && <input type="hidden" name="category" value={category} />}<label className="sr-only" htmlFor="blog-search">{ar ? 'ابحث في المقالات' : 'Search articles'}</label><input id="blog-search" name="q" defaultValue={query} maxLength={120} placeholder={ar ? 'ابحث عن قهوة أو بلد…' : 'A bean, a place, a question…'} className="min-w-0 flex-1 border border-sand/50 bg-transparent px-3 py-2 text-sm focus:outline-terracotta" /><button className="min-h-11 bg-charcoal px-4 text-xs text-cream">{ar ? 'بحث' : 'Search'}</button></form>
      </div>
      {featured && <BlogCard post={featured} lang={lang} featured />}
      <div className="mt-10 flex items-center justify-between"><h2 className="text-xs tracking-widest text-charcoal/60">{category ? BLOG_LABELS[category][lang] : ar ? 'استكشف المجلة' : 'EXPLORE THE JOURNAL'}</h2><span className="text-xs text-charcoal/60">{visible.length} {ar ? 'مقالًا' : 'stories'}</span></div>
      {visible.length ? <div className="mt-5 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{rest.map((post) => <BlogCard key={post.slug} post={post} lang={lang} />)}</div> : <div className="py-20 text-center"><h2 className="text-2xl">{ar ? 'لا توجد مقالات مطابقة بعد' : 'No matching stories yet'}</h2><p className="mt-3 text-charcoal/65">{ar ? 'جرّب اسمًا آخر أو تصفح جميع المقالات.' : 'Try a different term or explore all stories.'}</p><Link className="mt-6 inline-block border-b border-terracotta pb-2 text-terracotta" href={blogHref(null, lang)}>{ar ? 'كل المقالات' : 'All stories'}</Link></div>}
    </main><Footer /></div>
}
