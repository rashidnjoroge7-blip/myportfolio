import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminEmail } from "@/lib/adminAccess";
import { linkAuthenticatedClient } from "@/lib/clientIdentity";

const ALLOWED_REDIRECTS = new Set([
  "/admin",
  "/client/dashboard",
  "/client/reset-password",
]);

function redirectToLogin(
  origin: string,
  loginPath: string,
  error: string,
) {
  const url = new URL(loginPath, origin);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");

  const redirectPath =
    requestedNext && ALLOWED_REDIRECTS.has(requestedNext)
      ? requestedNext
      : "/client/dashboard";

  const isAdminFlow = redirectPath === "/admin";

  const loginPath = isAdminFlow
    ? "/admin/login"
    : "/client/login";

  if (!code) {
    return redirectToLogin(
      origin,
      loginPath,
      "authentication_failed",
    );
  }

  let supabase;

  try {
    supabase = await createSupabaseServerClient();

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error(
        "Supabase authorization code exchange failed:",
        exchangeError.message,
      );

      return redirectToLogin(
        origin,
        loginPath,
        "authentication_failed",
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await supabase.auth.signOut();

      return redirectToLogin(
        origin,
        loginPath,
        "authentication_failed",
      );
    }

    // Administrator OAuth must never enter the client identity flow.
    if (isAdminFlow) {
      if (
        !user.email_confirmed_at ||
        !isAdminEmail(user.email)
      ) {
        await supabase.auth.signOut();

        return redirectToLogin(
          origin,
          "/admin/login",
          "not_authorized",
        );
      }
    } else {
      // Client access requires a verified and uniquely linked profile.
      const identityResult = await linkAuthenticatedClient(user);

      if (!identityResult.success) {
        console.error(
          "Client identity linking rejected:",
          identityResult.reason,
        );

        await supabase.auth.signOut();

        return redirectToLogin(
          origin,
          "/client/login",
          "client_access_not_linked",
        );
      }
    }

    return NextResponse.redirect(
      new URL(redirectPath, origin),
    );
  } catch (error) {
    console.error("Authentication callback failed:", error);

    return redirectToLogin(
      origin,
      loginPath,
      "authentication_failed",
    );
  }
}