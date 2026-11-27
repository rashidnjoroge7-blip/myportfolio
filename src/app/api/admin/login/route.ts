import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminEmail } from "@/lib/adminAccess";
import {
  consumeAdminLoginLimit,
  getAdminLoginClientIp,
} from "@/lib/adminLoginRateLimit";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return jsonError("Invalid request origin.", 403);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonError("Invalid request format.", 415);
  }

  const contentLength = Number(
    request.headers.get("content-length") ?? "0",
  );

  if (!Number.isFinite(contentLength) || contentLength > 4096) {
    return jsonError("Request is too large.", 413);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Invalid request.", 400);
  }

  const payload = body as Record<string, unknown>;

  if (
    typeof payload.email !== "string" ||
    typeof payload.password !== "string"
  ) {
    return jsonError("Invalid email or password.", 400);
  }

  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (
    !email ||
    email.length > 254 ||
    !password ||
    password.length > 1024
  ) {
    return jsonError("Invalid email or password.", 400);
  }

  const clientIp = getAdminLoginClientIp({
    "x-real-ip": request.headers.get("x-real-ip") ?? undefined,
    "x-forwarded-for":
      request.headers.get("x-forwarded-for") ?? undefined,
  });

  try {
    // Apply the IP limit before checking the administrator allowlist.
    if (clientIp) {
      const ipAllowed = await consumeAdminLoginLimit("ip", clientIp);

      if (!ipAllowed) {
        return jsonError(
          "Too many login attempts. Try again later.",
          429,
        );
      }
    }

    if (!isAdminEmail(email)) {
      return jsonError("Invalid email or password.", 401);
    }

    const emailAllowed = await consumeAdminLoginLimit("email", email);

    if (!emailAllowed) {
      return jsonError(
        "Too many login attempts. Try again later.",
        429,
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return jsonError("Invalid email or password.", 401);
    }

    if (
      !data.user.email_confirmed_at ||
      !isAdminEmail(data.user.email)
    ) {
      await supabase.auth.signOut();
      return jsonError("This account is not authorized.", 403);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login failed:", error);

    // Fail closed if the persistent rate limiter or auth service fails.
    return jsonError(
      "Login is temporarily unavailable. Please try again later.",
      503,
    );
  }
}
