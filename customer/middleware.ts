import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // these pages are always public
  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/otp',
    '/auth/callback',
    '/auth/user-info',
    '/',
    '/shop',
  ]

  // allow public paths and shop listing pages
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/auth/')
  ) return NextResponse.next()

  // block shop/[id] and cart unless logged in
  const protectedPaths = ['/shop/', '/cart', '/checkout', '/profile', '/orders']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options))
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // save where they were going so we can redirect back after login
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}