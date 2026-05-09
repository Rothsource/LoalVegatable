
export const runtime = "edge"

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/callback',
    '/auth/merchant-info',
    '/auth/pending',
  ]
  if (publicPaths.some(p => pathname.startsWith(p))) return NextResponse.next()

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
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { data: merchant } = await supabase
    .from('profile_merchants')
    .select('is_approved')
    .eq('id', user.id)
    .single()

  if (!merchant) {
    return NextResponse.redirect(new URL('/auth/merchant-info', request.url))
  }

  if (!merchant.is_approved) {
    return NextResponse.redirect(new URL('/auth/pending', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
