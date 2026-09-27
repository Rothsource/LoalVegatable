import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/callback",
    "/auth/merchant-info",
    "/auth/pending",
    "/auth/reset-password",
    "/auth/distributor-login",
    "/auth/distributor-setup",
  ];
  if (publicPaths.some((path) => pathname.startsWith(path))) return NextResponse.next();

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const createRedirect = (path: string) => {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  if (!user) return createRedirect("/auth/login");

  if (user.user_metadata?.role === "distributor") {
    const { data: distributor } = await supabase
      .from("profile_distributors")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (!distributor) return createRedirect("/auth/login?error=distributor-access");

    const status = distributor.status?.toLowerCase();
    if (status === "pending") return createRedirect("/auth/pending");
    if (status === "inactive") return createRedirect("/auth/login?error=distributor-inactive");

    if (!pathname.startsWith("/distributors")) {
      return createRedirect("/distributors/products");
    }
    return response;
  }

  if (pathname.startsWith("/distributors")) {
    return createRedirect("/home");
  }

  if (pathname === "/") {
    return createRedirect("/home");
  }

  const { data: merchant } = await supabase
    .from("profile_merchants")
    .select("is_approved")
    .eq("id", user.id)
    .single();

  if (!merchant) return createRedirect("/auth/merchant-info");
  if (!merchant.is_approved) return createRedirect("/auth/pending");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.[\\w]+$).*)",
  ],
};