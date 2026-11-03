import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = "https://ywtoegqxxwegthrnrbsa.supabase.co";
  const serviceRoleKey =
    "hww9pMsG+fNq8pZ30Pzl6J0qqeuqqxFtDdDudN4WCiRwFJ8jzp+y3TmhDU/0ExC2";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
