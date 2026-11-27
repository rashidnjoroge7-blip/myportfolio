import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type ClientIdentityResult =
  | { success: true; clientId: string }
  | {
      success: false;
      reason:
        | "EMAIL_NOT_VERIFIED"
        | "EMAIL_MISSING"
        | "PROFILE_NOT_FOUND"
        | "AMBIGUOUS_PROFILE"
        | "PROFILE_OWNED_BY_ANOTHER_USER"
        | "LINK_FAILED";
    };

export async function linkAuthenticatedClient(
  user: User,
): Promise<ClientIdentityResult> {
  if (!user.email_confirmed_at) {
    return { success: false, reason: "EMAIL_NOT_VERIFIED" };
  }

  const email = user.email?.trim().toLowerCase();

  if (!email) {
    return { success: false, reason: "EMAIL_MISSING" };
  }

  const admin = getSupabaseAdmin();

  const { data: profiles, error: lookupError } = await admin
    .from("clients")
    .select("id, auth_user_id")
    .eq("email", email);

  if (lookupError) {
    console.error("Client identity lookup failed:", lookupError.message);
    return { success: false, reason: "LINK_FAILED" };
  }

  if (!profiles || profiles.length === 0) {
    return { success: false, reason: "PROFILE_NOT_FOUND" };
  }

  if (profiles.length !== 1) {
    return { success: false, reason: "AMBIGUOUS_PROFILE" };
  }

  const profile = profiles[0];

  if (profile.auth_user_id === user.id) {
    return { success: true, clientId: profile.id };
  }

  if (profile.auth_user_id !== null) {
    return {
      success: false,
      reason: "PROFILE_OWNED_BY_ANOTHER_USER",
    };
  }

  const { data: linkedProfile, error: updateError } = await admin
    .from("clients")
    .update({ auth_user_id: user.id })
    .eq("id", profile.id)
    .is("auth_user_id", null)
    .select("id, auth_user_id")
    .maybeSingle();

  if (updateError) {
    console.error("Client identity linking failed:", updateError.message);
    return { success: false, reason: "LINK_FAILED" };
  }

  if (!linkedProfile) {
    return {
      success: false,
      reason: "PROFILE_OWNED_BY_ANOTHER_USER",
    };
  }

  return { success: true, clientId: linkedProfile.id };
}