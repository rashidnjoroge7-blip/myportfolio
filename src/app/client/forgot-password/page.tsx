"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const redirectTo = new URL(
      "/auth/callback?next=%2Fclient%2Freset-password",
      window.location.origin,
    ).toString();

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setMessage(
      error
        ? "Unable to send a reset link. Check the email address and try again."
        : "If an account is registered for that email, a password reset link has been sent.",
    );
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Reset your password</h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          Enter the email address associated with your client portal account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text)]">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm text-[var(--text)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        {message && <p role="status" className="mt-4 text-sm text-[var(--muted)]">{message}</p>}
        <Link href="/client/login" className="mt-6 inline-block text-sm text-[var(--accent)]">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
