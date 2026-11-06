"use client";

import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <h1 className="mb-2 text-2xl font-bold">Admin Portal</h1>

        <p className="mb-6 text-gray-400">
          Sign in with your authorized Google account to continue.
        </p>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-gray-200"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
