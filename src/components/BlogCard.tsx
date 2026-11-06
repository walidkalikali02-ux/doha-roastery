import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react'
import { BLOG_LABELS, blogHref, readingMinutes, type BlogLang, type BlogPost } from '@/lib/blog-types'

export default function BlogCard({ post, lang, featured = false }: { post: BlogPost; lang: BlogLang; featured?: boolean }) {
  const Arrow = lang === 'ar' ? ArrowUpLeft : ArrowUpRight
  return <article className={featured ? 'grid gap-7 border-b border-sand/40 pb-12 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-12' : 'group border-t border-sand/40 pt-5'}>
    <Link href={blogHref(post.slug, lang)} tabIndex={-1} aria-hidden="true" className="relative block aspect-[3/2] overflow-hidden bg-cream-dark">
      <Image src={post.image_url} alt="" fill sizes={featured ? '(max-width: 768px) 100vw, 60vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'} unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" loading={featured ? 'eager' : 'lazy'} />
    </Link>
    <div className={featured ? '' : 'pt-5'}>
      <p className="mb-4 text-xs font-medium tracking-wider text-terracotta">{BLOG_LABELS[post.category][lang]} <span className="px-2 text-sand" aria-hidden="true">/</span> {readingMinutes(post[`content_${lang}`])} {lang === 'ar' ? 'دقائق قراءة' : 'min read'}</p>
      <h2 className={featured ? 'text-3xl font-medium leading-[1.6] sm:text-4xl' : 'text-xl font-medium leading-relaxed sm:text-2xl'}><Link className="hover:text-terracotta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terracotta" href={blogHref(post.slug, lang)}>{post[`title_${lang}`]}</Link></h2>
      <p className="mt-4 text-sm leading-[1.9] text-charcoal/65 sm:text-base">{post[`excerpt_${lang}`]}</p>
      <Link href={blogHref(post.slug, lang)} className="mt-6 inline-flex min-h-11 items-center gap-3 border-b border-sand text-sm hover:text-terracotta" aria-label={`${lang === 'ar' ? 'اقرأ' : 'Read'}: ${post[`title_${lang}`]}`}>{lang === 'ar' ? 'اقرأ المقال' : 'Read the story'}<Arrow size={17} strokeWidth={1.5} /></Link>
    </div>
  </article>
}
