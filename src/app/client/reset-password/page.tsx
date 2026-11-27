"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(recoveryCode)) {
      setError("Enter the complete six-digit recovery code.");
      return;
    }

    if (password.length < 12) {
      setError("Your password must contain at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Verify the six-digit recovery code.
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: recoveryCode,
        type: "recovery",
      });

      if (verifyError) {
        console.error(
          "Recovery code verification failed:",
          verifyError.message,
        );

        setError(
          "The recovery code is invalid or expired. Please request a new code.",
        );
        return;
      }

      // Confirm the authenticated recovery session.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user ||
        user.email?.trim().toLowerCase() !== normalizedEmail
      ) {
        await supabase.auth.signOut();

        setError(
          "We could not verify your recovery session. Please request a new code.",
        );
        return;
      }

      // Update the authenticated user's password.
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error(
          "Password update failed:",
          updateError.message,
        );

        setError(
          "Unable to update your password. Please try again.",
        );
        return;
      }

      setMessage(
        "Your password has been updated successfully. Redirecting to login...",
      );

      await supabase.auth.signOut();

      router.replace("/client/login");
    } catch (err) {
      console.error("Password reset failed:", err);
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
            Enter your email, the six-digit recovery code sent to your inbox,
            and choose a new password.
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

            <div>
              <label
                htmlFor="recovery-code"
                className="block text-sm font-medium text-[var(--text)] mb-1"
              >
                Six-digit recovery code
              </label>

              <input
                id="recovery-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={recoveryCode}
                onChange={(e) =>
                  setRecoveryCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                required
                disabled={loading}
                placeholder="123456"
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm tracking-[0.3em] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text)] mb-1"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={12}
                required
                disabled={loading}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-[var(--text)] mb-1"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={12}
                required
                disabled={loading}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-2)] transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-green-600">
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