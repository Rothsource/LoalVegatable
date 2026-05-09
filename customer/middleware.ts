
export const runtime = "experimental-edge"

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/otp',
    '/auth/callback',
    '/auth/user-info',
    '/',
    '/shop',
  ]

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/auth/')
  ) return NextResponse.next()

  const protectedPaths = ['/shop/', '/cart', '/checkout', '/profile', '/orders']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // ✅ Create response ONCE and always pass it through so
  //    Supabase can write refreshed session cookies onto it.
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // ✅ Write onto the SAME response object we'll return
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response // ✅ Returns with any refreshed cookies attached
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
