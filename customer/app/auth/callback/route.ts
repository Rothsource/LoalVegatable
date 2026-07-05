import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const redirectTo = searchParams.get('redirectTo') || '/'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // ── Password recovery links go straight to the reset-password page,
    // no matter what state their profile is in. This must be checked
    // BEFORE the profile-complete logic below, or a user resetting their
    // password would get redirected to '/' or '/auth/user-info' instead
    // of ever seeing the "set new password" form. ──
    if (type === 'recovery' && data?.user) {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    const user = data?.user
    if (user) {
      // ── Same rule as email/password login: if the profile is already
      // filled in (name + delivery location), skip onboarding and go
      // straight to wherever they were headed. Otherwise, make them
      // complete it first. ──
      const { data: profile } = await supabase
        .from('profile_users')
        .select('first_name, location')
        .eq('id', user.id)
        .maybeSingle()

      const profileComplete = !!profile?.first_name && !!profile?.location

      if (profileComplete) {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }
  }

  // No code, no user, or profile not filled in yet → finish onboarding
  return NextResponse.redirect(`${origin}/auth/user-info`)
}