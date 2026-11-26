"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkActivationSession() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;
      setSessionValid(!error && Boolean(user));
      setCheckingSession(false);
    }

    void checkActivationSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!sessionValid) {
      setMessage("Your activation session is missing or expired. Ask the administrator to resend your access link.");
      return;
    }

    if (password.length < 10) {
      setMessage("Use a password with at least 10 characters.");
      return;
    }

    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Initial password activation failed:", error.message);
        setMessage("Unable to set your password. Please try again.");
        return;
      }

      router.replace("/client/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Unexpected activation error:", error);
      setMessage("Unable to set your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <p className="text-sm text-[var(--muted)]">Verifying your activation link...</p>
      </main>
    );
  }

  if (!sessionValid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Activation link expired</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Your client access session is missing or has expired. Contact the project administrator and ask them to resend your client portal access link.
          </p>
          <Link
            href="/client/login"
            className="mt-6 inline-flex text-sm font-semibold text-[var(--accent)]"
          >
            Back to client sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Activate your client account</h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          Choose a password to finish setting up your client portal access.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--text)]">
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
          </div>

          <div>
            <label htmlFor="confirmation" className="mb-1 block text-sm font-medium text-[var(--text)]">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Activating..." : "Set password"}
          </button>
        </form>

        {message && (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
