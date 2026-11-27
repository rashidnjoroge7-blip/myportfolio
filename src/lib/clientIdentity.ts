import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type LinkedClient = {
  id: string;
  email: string;
};

export async function linkAuthenticatedClient(
  user: User,
): Promise<{ client: LinkedClient | null; error: string | null }> {
  const email = user.email?.trim().toLowerCase();

  if (!email || !user.email_confirmed_at) {
    return { client: null, error: "A verified email address is required." };
  }

  const supabase = getSupabaseAdmin();
  const { data: matches, error: lookupError } = await supabase
    .from("clients")
    .select("id,email,auth_user_id")
    .eq("email", email)
    .limit(2);

  if (lookupError) {
    console.error("Client identity lookup failed:", lookupError.message);
    return { client: null, error: "Unable to verify this client account." };
  }

  if (!matches || matches.length !== 1) {
    return { client: null, error: "No unique client profile is registered for this email." };
  }

  const profile = matches[0];

  if (profile.auth_user_id === user.id) {
    return { client: { id: profile.id, email: profile.email }, error: null };
  }

  if (profile.auth_user_id) {
    return { client: null, error: "This client profile is already linked to another account." };
  }

  const { data: linked, error: linkError } = await supabase
    .from("clients")
    .update({ auth_user_id: user.id, updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .is("auth_user_id", null)
    .select("id,email")
    .maybeSingle();

  if (linkError) {
    console.error("Client identity link failed:", linkError.message);
    return { client: null, error: "Unable to link this client account." };
  }

  if (linked) {
    return { client: { id: linked.id, email: linked.email }, error: null };
  }

  // A concurrent callback may have linked the same profile first.
  const { data: latest, error: verifyError } = await supabase
    .from("clients")
    .select("id,email,auth_user_id")
    .eq("id", profile.id)
    .maybeSingle();

  if (!verifyError && latest?.auth_user_id === user.id) {
    return { client: { id: latest.id, email: latest.email }, error: null };
  }

  return { client: null, error: "This client profile could not be securely linked." };
}
