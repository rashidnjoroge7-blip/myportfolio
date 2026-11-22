import { createHmac } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { getSupabaseAdmin } from "./supabaseAdmin";

type IdentifierType = "ip" | "email";

function readHeader(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Prefer the reverse proxy's client-IP header.
 * Return null when no usable IP is available.
 */
export function getAdminLoginClientIp(
  headers: IncomingHttpHeaders | undefined,
): string | null {
  const realIp = readHeader(headers?.["x-real-ip"])?.trim();

  const forwardedIp = readHeader(headers?.["x-forwarded-for"])
    ?.split(",")[0]
    ?.trim();

  return realIp || forwardedIp || null;
}

/**
 * Consume one attempt from the persistent 15-minute login bucket.
 * Identifiers are HMAC-hashed and never stored in plain text.
 */
export async function consumeAdminLoginLimit(
  type: IdentifierType,
  identifier: string,
): Promise<boolean> {
  const hmacKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hmacKey) {
    throw new Error("Admin login rate limiter is not configured.");
  }

  const normalizedIdentifier =
    type === "email" ? identifier.trim().toLowerCase() : identifier.trim();

  if (!normalizedIdentifier) {
    throw new Error("Invalid admin login rate-limit identifier.");
  }

  const identifierHash = createHmac("sha256", hmacKey)
    .update(`admin-login:${type}:${normalizedIdentifier}`)
    .digest("hex");

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc(
    "consume_api_rate_limit",
    {
      p_endpoint: "admin_login",
      p_identifier_hash: identifierHash,
      p_limit: 5,
      p_window_seconds: 900,
    },
  );

  if (error) {
    console.error("Admin login rate limiter failed:", error.message);
    throw new Error("Admin login rate limiter unavailable.");
  }

  return data === true;
}
