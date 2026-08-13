"use client";

import { useActionState } from "react";
import { loginAction, loginWithGoogle } from "./actions";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-600 text-white text-lg font-bold mb-4">
            R
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">AAC Ops</h1>
          <p className="text-sm text-neutral-500 mt-1">Internal delivery tooling</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 space-y-4">
          <form action={loginWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-200 text-sm font-medium py-2.5 hover:bg-neutral-50 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.89z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.84l-3.88-3.02c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.31 14.37a7.2 7.2 0 0 1 0-4.74V6.54H1.3a12 12 0 0 0 0 10.92z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.3 6.54l4.01 3.09C6.25 6.81 8.89 4.75 12 4.75z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">or</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="admin@aianalyticsconsole.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-indigo-600 text-white text-sm font-medium py-2.5 hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-xs text-neutral-400 text-center pt-2">
            Demo: admin@aianalyticsconsole.com / password123
          </p>
          </form>
        </div>
      </div>
    </div>
  );
}
