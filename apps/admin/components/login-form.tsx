"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions";

const input = "mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 focus:border-action-600 focus:ring-2 focus:ring-action-600/20 focus:outline-none";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  const message = state.message ?? notice;
  return (
    <form action={action} className="mt-6 space-y-4">
      {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-900">{message}</p>}
      <label className="block text-sm font-semibold">Email<input name="email" type="email" autoComplete="username" required className={input} /></label>
      <label className="block text-sm font-semibold">Password<input name="password" type="password" autoComplete="current-password" required className={input} /></label>
      <button disabled={pending} className="h-11 w-full rounded-lg bg-action-600 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
