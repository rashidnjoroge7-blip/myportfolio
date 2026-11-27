"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ClientLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Validate existing sessions before allowing dashboard access.
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active || !session) return;

        const response = await fetch("/api/client/link-identity", {
          method: "POST",
        });

        if (!active) return;

        if (response.ok) {
          router.replace("/client/dashboard");
        } else {
          setMessage(
            "Your account could not be linked to a client profile. Please contact support.",
          );
        }
      } catch (error) {
        console.error("Session verification failed:", error);

        if (active) {
          setMessage("Unable to verify your session. Please try again.");
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  // Magic-link authentication.
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/client/dashboard")}`,
        },
      });

      if (error) {
        setMessage("Unable to send the magic link. Please try again.");
      } else {
        setMessage("Check your email for the magic link!");
      }
    } catch (error) {
      console.error("Magic link request failed:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Password authentication with client identity verification.
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage("Unable to sign in. Check your credentials and try again.");
        return;
      }

      const response = await fetch("/api/client/link-identity", {
        method: "POST",
      });

      if (!response.ok) {
        setMessage(
          "Your account could not be linked to a client profile. Please contact support.",
        );
        return;
      }

      router.replace("/client/dashboard");
    } catch (error) {
      console.error("Client password login failed:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-[var(--bg)]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            Client Portal
          </h1>

          <p className="text-[var(--muted)] mb-6">
            Sign in to access your projects.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode("password")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loginMode === "password"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-alt)] text-[var(--muted)]"
              }`}
            >
              Password
            </button>

            <button
              type="button"
              onClick={() => setLoginMode("magic")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                loginMode === "magic"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface-alt)] text-[var(--muted)]"
              }`}
            >
              Magic Link
            </button>
          </div>

          {loginMode === "password" ? (
            <>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[var(--text)] mb-1"
                  >
                    Email Address
                  </label>

                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--text)] mb-1"
                  >
                    Password
                  </label>

                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-2)] transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="mt-3 text-right">
                <Link
                  href="/client/forgot-password"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label
                  htmlFor="email-magic"
                  className="block text-sm font-medium text-[var(--text)] mb-1"
                >
                  Email Address
                </label>

                <input
                  type="email"
                  id="email-magic"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-2)] transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-4 text-sm text-center text-[var(--accent)]">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
