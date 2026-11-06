import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BlogCard from '@/components/BlogCard'
import BlogLocale from '@/components/BlogLocale'
import BlogBody, { blogBlocks } from '@/components/BlogBody'
import { getPublishedPost, getPublishedPosts } from '@/lib/blog'
import { BLOG_LABELS, blogHref, readingMinutes, type BlogLang } from '@/lib/blog-types'
import { blogMetadata, blogPostingJsonLd } from '@/lib/blog-seo'
import { breadcrumbJsonLd } from '@/lib/seo'
import { safeJsonLd } from '@/lib/json-ld'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }
export async function generateMetadata({ params, searchParams }: Props) {
  const post = await getPublishedPost((await params).slug)
  if (!post) return { title: 'Article not found', robots: { index: false, follow: false } }
  return blogMetadata(post, (await searchParams).lang === 'en' ? 'en' : 'ar')
}
export default async function ArticlePage({ params, searchParams }: Props) {
  const post = await getPublishedPost((await params).slug)
  if (!post) notFound()
  const lang: BlogLang = (await searchParams).lang === 'en' ? 'en' : 'ar'
  const ar = lang === 'ar'
  const content = post[`content_${lang}`]
  const related = (await getPublishedPosts()).filter((item) => item.slug !== post.slug).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3)
  const headings = blogBlocks(content).map((text, index) => ({ text, index })).filter(({ text }) => text.startsWith('## '))
  const date = (value: string) => new Intl.DateTimeFormat(ar ? 'ar-QA' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(value))
  return <div className="flex min-h-screen flex-col"><BlogLocale lang={lang} /><Header />
    <main dir={ar ? 'rtl' : 'ltr'} lang={lang} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-36 sm:px-8 sm:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(blogPostingJsonLd(post, lang)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd([{ name: ar ? 'الرئيسية' : 'Home', path: '/' }, { name: ar ? 'مجلة القهوة' : 'Coffee journal', path: blogHref(null, lang) }, { name: post[`title_${lang}`], path: blogHref(post.slug, lang) }])) }} />
      <nav aria-label={ar ? 'مسار الصفحة' : 'Breadcrumb'} className="mb-10 flex flex-wrap items-center justify-between gap-4 text-sm"><Link href={blogHref(null, lang)} className="border-b border-sand pb-1 hover:text-terracotta">{ar ? 'العودة إلى مجلة القهوة' : 'Back to the coffee journal'}</Link><Link href={blogHref(post.slug, ar ? 'en' : 'ar')} hrefLang={ar ? 'en' : 'ar'} className="min-h-11 content-center underline underline-offset-4">{ar ? 'Read in English' : 'اقرأ بالعربية'}</Link></nav>
      <article>
        <header className="mx-auto max-w-4xl pb-10">
          <Link href={`/blog?category=${post.category}${ar ? '' : '&lang=en'}`} className="text-xs font-medium tracking-widest text-terracotta">{BLOG_LABELS[post.category][lang]}</Link>
          <h1 className="mt-5 text-3xl font-medium leading-[1.6] sm:text-5xl">{post[`title_${lang}`]}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-[1.9] text-charcoal/65">{post[`excerpt_${lang}`]}</p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs leading-relaxed text-charcoal/65"><span>{ar ? 'بقلم فريق دوحة روستري' : 'By the Doha Roastery team'}</span>{post.published_at && <time dateTime={post.published_at}>{date(post.published_at)}</time>}<span>{readingMinutes(content)} {ar ? 'دقائق قراءة' : 'min read'}</span></div>
        </header>
        <figure className="mb-12"><div className="relative aspect-[3/2] overflow-hidden bg-cream-dark sm:aspect-[2/1]"><Image src={post.image_url} alt={post[`image_alt_${lang}`]} fill sizes="(max-width: 1280px) 100vw, 1280px" unoptimized loading="eager" className="object-cover" /></div><figcaption className="mt-3 text-xs leading-relaxed text-charcoal/55">{post[`image_alt_${lang}`]}</figcaption></figure>
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,740px)] lg:justify-center lg:gap-14">
          <aside><nav aria-label={ar ? 'في هذا المقال' : 'On this page'} className="border-t border-sand/50 pt-5 lg:sticky lg:top-32"><p className="mb-4 text-xs font-semibold tracking-widest">{ar ? 'في هذا المقال' : 'ON THIS PAGE'}</p><ol className="space-y-3 text-sm leading-relaxed text-charcoal/65">{headings.map(({ text, index }) => <li key={index}><a href={`#section-${index}`} className="hover:text-terracotta">{text.slice(3)}</a></li>)}</ol></nav></aside>
          <div className="min-w-0"><BlogBody content={content} />
            {post.sources.length > 0 && <section className="mt-12 border-t border-sand/40 pt-7"><h2 className="text-sm font-semibold">{ar ? 'مصادر للتوسع' : 'Further reading & sources'}</h2><ul className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal/65">{post.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-sand underline-offset-4 hover:text-terracotta">{source.label}<span className="sr-only">{ar ? ' (يفتح في نافذة جديدة)' : ' (opens in a new tab)'}</span></a></li>)}</ul></section>}
            <div className="mt-12 bg-cream-dark px-6 py-8"><h2 className="text-xl font-medium">{ar ? 'من المعرفة إلى الفنجان' : 'From reading to your next cup'}</h2><p className="mt-3 text-sm leading-relaxed text-charcoal/65">{ar ? 'استكشف القهوة المتاحة الآن، واقرأ بيانات المنشأ والمعالجة على كل عبوة.' : 'Explore the coffees currently available and discover the origin and processing details for each bag.'}</p><Link href="/products" className="mt-5 inline-block min-h-11 content-center border-b border-terracotta text-sm text-terracotta">{ar ? 'تصفح القهوة' : 'Explore our coffee'}</Link></div>
          </div>
        </div>
      </article>
      {related.length > 0 && <section className="mt-20 border-t border-sand/40 pt-10"><h2 className="text-2xl font-medium">{ar ? 'تابع رحلة المعرفة' : 'Continue exploring'}</h2><div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <BlogCard key={item.slug} post={item} lang={lang} />)}</div></section>}
    </main><Footer /></div>
}
