"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setRequested(false);
    setMessage("");

    try {
      const redirectTo = new URL(
        "/client/reset-password",
        window.location.origin,
      ).toString();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );

      if (error) {
        console.error("Password recovery request failed:", error.message);
        setMessage(
          error.status === 429 || error.code === "over_email_send_rate_limit"
            ? "A recovery email was requested recently. Wait about 60 seconds before requesting another code."
            : "Unable to request a recovery code right now. Please try again later.",
        );
        return;
      }

      setRequested(true);
      setMessage(
        "If a client portal account exists for that email, a six-digit recovery code has been sent. Check your inbox and spam folder.",
      );
    } catch (error) {
      console.error("Unexpected password recovery error:", error);
      setMessage(
        "Unable to request a recovery code right now. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">
          Reset your password
        </h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          Enter the email address associated with your client portal account.
          We will send a six-digit recovery code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text)]"
          >
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
            {loading ? "Sending..." : "Send recovery code"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-4 text-sm text-[var(--muted)]">
            {message}
          </p>
        )}

        {requested && (
          <Link
            href="/client/reset-password"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/10"
          >
            Enter recovery code
          </Link>
        )}

        <Link
          href="/client/login"
          className="mt-6 inline-block text-sm text-[var(--accent)]"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
