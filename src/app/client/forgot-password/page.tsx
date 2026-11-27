"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
        );

      if (resetError) {
        console.error(
          "Password recovery request failed:",
          resetError.message,
        );

        setError("Unable to process your request. Please try again.");
        return;
      }

      setMessage(
        "If an account exists for that email, a six-digit recovery code will be sent. Please check your inbox.",
      );
    } catch (err) {
      console.error("Password recovery error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            Reset your password
          </h1>

          <p className="text-[var(--muted)] mb-6">
            Enter your client account email address. We will send you a
            six-digit recovery code if an account exists.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text)] mb-1"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-2)] transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Recovery Code"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-[var(--text)]">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-center text-red-500">
              {error}
            </p>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/client/login"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Back to Client Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}