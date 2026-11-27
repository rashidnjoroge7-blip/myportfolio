import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminEmail } from "@/lib/adminAccess";

const CACHE_HEADERS = ["Cache-Control", "Expires", "Pragma"];

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  response: NextResponse,
  error?: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (error) url.searchParams.set("error", error);

  const redirectResponse = NextResponse.redirect(url);

  // Preserve refreshed Supabase cookies on redirects.
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  for (const header of CACHE_HEADERS) {
    const value = response.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  // Validate the JWT; do not trust getSession() for server-side authorization.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const email = typeof claims?.email === "string" ? claims.email : null;
  const pathname = request.nextUrl.pathname;

  const isAdminLogin = pathname === "/admin/login";
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isClientDashboard =
    pathname === "/client/dashboard" ||
    pathname.startsWith("/client/dashboard/");

  if (isAdminRoute && !isAdminLogin) {
    if (!userId) {
      return redirectWithCookies(
        request, "/admin/login", supabaseResponse, "session_required",
      );
    }

    if (!isAdminEmail(email)) {
      return redirectWithCookies(
        request, "/admin/login", supabaseResponse, "not_admin",
      );
    }
  }

  if (isClientDashboard && !userId) {
    return redirectWithCookies(request, "/client/login", supabaseResponse);
  }

  return supabaseResponse;
}
