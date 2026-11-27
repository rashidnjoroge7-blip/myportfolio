"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      return;
    }

    window.location.assign("/admin/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
