import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/adminAccess";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !user?.email ||
    !user.email_confirmed_at ||
    !isAdminEmail(user.email)
  ) {
    return null;
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login?error=not_authorized");
  }

  return user;
}
