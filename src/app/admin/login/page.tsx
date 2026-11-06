"use client";

import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
      <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Admin Portal</h1>
        <p className="text-gray-400 mb-6">
          Sign in with your authorized Google account to continue.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full py-3 px-4 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
