"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 🔥 Automatically log in if a magic link token is in the URL
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/client/dashboard");
      }
    };
    checkSession();
  }, [router]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/client/dashboard")}`,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Check your email for the magic link!");
    }

    setLoading(false);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      router.push("/client/dashboard");
    }

    setLoading(false);
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
