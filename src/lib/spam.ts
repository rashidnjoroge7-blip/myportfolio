import { createHmac } from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const ipRequestTimes = new Map<string, number[]>();

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (forwarded ? forwarded.split(",")[0].trim() : realIp?.trim()) || "unknown";
}

export function recordRequest(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const requests = ipRequestTimes.get(ip) || [];
  const windowed = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  windowed.push(now);
  ipRequestTimes.set(ip, windowed);
}

export function isRateLimited(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const requests = ipRequestTimes.get(ip) || [];
  const windowed = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  ipRequestTimes.set(ip, windowed);
  return windowed.length >= RATE_LIMIT_MAX_REQUESTS;
}

export function isTooFast(startedAt: unknown) {
  const startedAtNumber = Number(startedAt);
  if (!startedAtNumber || Number.isNaN(startedAtNumber)) {
    return true;
  }
  return Date.now() - startedAtNumber < 3000;
}

type TurnstileVerificationResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
};

export async function verifyTurnstile(
  token: string,
  expectedAction: "contact_form" | "quote_form",
  request: Request,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error("Turnstile secret key is not configured.");
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const ip = getClientIp(request);

  if (ip !== "unknown") {
    body.set("remoteip", ip);
  }

  let response: Response;

  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    throw new Error("Turnstile verification service unavailable.");
  }

  if (!response.ok) {
    throw new Error("Turnstile verification service unavailable.");
  }

  let result: TurnstileVerificationResponse;

  try {
    result = (await response.json()) as TurnstileVerificationResponse;
  } catch {
    throw new Error("Invalid Turnstile verification response.");
  }

  const allowedHosts =
    process.env.NODE_ENV === "production"
      ? ["unihost.co.ke", "www.unihost.co.ke"]
      : [
          "unihost.co.ke",
          "www.unihost.co.ke",
          "localhost",
          "127.0.0.1",
        ];

  return (
    result.success === true &&
    allowedHosts.includes((result.hostname || "").toLowerCase()) &&
    result.action === expectedAction
  );
}

// Distributed PostgreSQL rate limiter.
// IP addresses are HMAC-hashed before being stored.
export async function consumeDistributedRateLimit(
  request: Request,
  endpoint: "contact" | "quote"
): Promise<boolean> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Rate limiter unavailable: Supabase service key missing.");
  }

  const ip = getClientIp(request);

  const identifierHash = createHmac("sha256", serviceRoleKey)
    .update(ip)
    .digest("hex");

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc(
    "consume_api_rate_limit",
    {
      p_endpoint: endpoint,
      p_identifier_hash: identifierHash,
      p_limit: 5,
      p_window_seconds: 60,
    }
  );

  if (error) {
    console.error("Distributed rate limiter error:", error.message);
    throw new Error("Rate limiter unavailable.");
  }

  return data === true;
}
