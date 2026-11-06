import { privatePageMetadata } from '@/lib/seo'
import AdminBlogClient from './AdminBlogClient'
import { BLOG_STARTER_ARTICLES } from '@/lib/blog-seed'

export const metadata = privatePageMetadata
export default function AdminBlogPage() { return <AdminBlogClient starterCount={BLOG_STARTER_ARTICLES.length} /> }
