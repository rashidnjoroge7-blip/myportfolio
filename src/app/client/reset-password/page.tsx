"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 10) {
      setMessage("Use a password with at least 10 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !user) {
      setMessage("Your reset session is invalid or expired. Request a new reset link.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("Unable to update your password. Request a new reset link and try again.");
      setLoading(false);
      return;
    }

    router.replace("/client/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Set a new password</h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          Choose a password with at least 10 characters.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text)]">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)]"
          />
          <label htmlFor="confirmation" className="block text-sm font-medium text-[var(--text)]">
            Confirm password
          </label>
          <input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
        {message && <p role="alert" className="mt-4 text-sm text-red-500">{message}</p>}
      </div>
    </main>
  );
}
