import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        }
      }
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    if (data?.session?.user?.user_metadata?.role === 'distributor') {
      return NextResponse.redirect(`${origin}/distributors/products`)
    }
  }

  // if it's a password reset, go to reset page
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  return NextResponse.redirect(`${origin}/auth/merchant-info`)
}