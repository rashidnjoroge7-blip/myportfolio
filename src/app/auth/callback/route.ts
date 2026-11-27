import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const isAdminFlow = searchParams.get("next") === "/admin";

  // Accept only the known application destinations after authentication.
  const destination = isAdminFlow ? "/admin" : "/client/dashboard";
  const loginPath = isAdminFlow ? "/admin/login" : "/client/login";

  if (!code) {
    return NextResponse.redirect(
      new URL(`${loginPath}?error=missing_code`, origin),
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return NextResponse.redirect(
      new URL(`${loginPath}?error=configuration`, origin),
    );
  }

  const response = NextResponse.redirect(new URL(destination, origin));
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

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase callback error:", error.message);
    return NextResponse.redirect(
      new URL(`${loginPath}?error=authentication_failed`, origin),
    );
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
