import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { linkAuthenticatedClient } from "@/lib/clientIdentity";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  const allowedNext = new Set([
    "/client/dashboard",
    "/client/reset-password",
  ]);
  const redirectPath =
    requestedNext && allowedNext.has(requestedNext)
      ? requestedNext
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

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Supabase callback error:", exchangeError.message);
    return NextResponse.redirect(
      new URL("/client/login?error=authentication_failed", origin),
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/client/login?error=authentication_failed", origin),
    );
  }

  const { error: identityError } = await linkAuthenticatedClient(user);

  if (identityError) {
    console.error("Client account linking rejected:", identityError);
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/client/login?error=account_not_provisioned", origin),
    );
  }

  return NextResponse.redirect(new URL(redirectPath, origin));
}
