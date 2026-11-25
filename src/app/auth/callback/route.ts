import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Only allow safe internal redirect paths.
  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/client/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/client/login?error=missing_code", origin),
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Supabase callback error:", error.message);

    return NextResponse.redirect(
      new URL("/client/login?error=authentication_failed", origin),
    );
  }

  return NextResponse.redirect(new URL(redirectPath, origin));
}
