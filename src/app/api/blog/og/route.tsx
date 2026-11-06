import { ImageResponse } from 'next/og'
import { getPublishedPost } from '@/lib/blog'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  const post = slug ? await getPublishedPost(slug) : null
  if (slug && !post) return new Response('Article not found', { status: 404 })
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#f8f4ee', color: '#29251f', padding: '65px', flexDirection: 'column', justifyContent: 'space-between', borderBottom: '16px solid #a08060' }}>
      <div style={{ display: 'flex', fontSize: 25, letterSpacing: 5, color: '#8b4513' }}>DOHA ROASTERY / COFFEE JOURNAL</div>
      <div style={{ display: 'flex', fontSize: 65, lineHeight: 1.2, maxWidth: 1040 }}>{post?.title_en ?? 'Every bean. A story worth knowing.'}</div>
      <div style={{ display: 'flex', fontSize: 24, color: '#75634f' }}>{post ? `${post.category.toUpperCase()}  ·  doharoastery.com/blog` : 'Species · Varieties · Origins'}</div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },
  )
}
