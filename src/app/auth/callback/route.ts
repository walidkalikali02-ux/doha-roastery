import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const requestedNext = url.searchParams.get('next')
  const next = requestedNext?.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/account'
  const loginUrl = new URL('/auth/login', url.origin)
  loginUrl.searchParams.set('next', next)

  if (code) loginUrl.searchParams.set('code', code)
  else loginUrl.searchParams.set('oauth_error', '1')

  return NextResponse.redirect(loginUrl)
}
