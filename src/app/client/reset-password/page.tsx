"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkExistingRecoverySession() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      // This also lets a user finish after refreshing the page once the OTP
      // has already been verified. An authenticated user may change their
      // own password without requesting another recovery code.
      if (!error && user) {
        setRecoveryVerified(true);
        setEmail(user.email ?? "");
      }

      setCheckingSession(false);
    }

    void checkExistingRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.trim();

    if (!recoveryVerified && !normalizedEmail) {
      setMessage("Enter the email address that received the recovery code.");
      return;
    }

    if (!recoveryVerified && !/^\\d{8}$/.test(normalizedToken)) {
      setMessage("Enter the eight-digit recovery code from your email.");
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
      if (!recoveryVerified) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: normalizedEmail,
          token: normalizedToken,
          type: "recovery",
        });

        if (verifyError) {
          console.error("Password recovery code verification failed:", verifyError.message);
          setMessage(
            "That recovery code is invalid or expired. Request a new code and try again.",
          );
          return;
        }

        setRecoveryVerified(true);
        setEmail(normalizedEmail);
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Password update failed:", updateError.message);
        setMessage(
          "Your recovery code was accepted, but the password could not be updated. Try again with a different password.",
        );
        return;
      }

      router.replace("/client/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Unexpected password reset error:", error);
      setMessage("Unable to update your password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
        <p className="text-sm text-[var(--muted)]">Checking your recovery session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">
          Set a new password
        </h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          {recoveryVerified
            ? "Choose a new password for your client portal account."
            : "Enter the eight-digit code sent to your email address, then choose a new password."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!recoveryVerified && (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
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
              </div>

              <div>
                <label
                  htmlFor="token"
                  className="mb-1 block text-sm font-medium text-[var(--text)]"
                >
                  Eight-digit recovery code
                </label>
                <input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{8}"
                  minLength={8}
                  maxLength={8}
                  required
                  value={token}
                  onChange={(event) =>
                    setToken(event.target.value.replace(/\\D/g, "").slice(0, 8))
                  }
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-3 text-sm tracking-[0.3em] text-[var(--text)]"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[var(--text)]"
            >
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
            <label
              htmlFor="confirmation"
              className="mb-1 block text-sm font-medium text-[var(--text)]"
            >
              Confirm new password
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
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        {message && (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {message}
          </p>
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
