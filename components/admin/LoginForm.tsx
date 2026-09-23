"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClientAuth } from "@/lib/firebase/client";
import { signInWithCustomToken } from "firebase/auth";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 401) {
        setError("Incorrect password.");
        setBusy(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        setBusy(false);
        return;
      }

      if (data.customToken) {
        try {
          await signInWithCustomToken(getClientAuth(), data.customToken);
        } catch {
          // firebase sign-in is only for live rules access; the session cookie
          // is what truly authorizes the dashboard — continue either way.
        }
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wide text-blossom-sage">Admin password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-xl border border-blossom-blush/40 bg-blossom-cream px-4 py-3 text-blossom-ink placeholder:text-blossom-ink/30 focus:border-blossom-rose focus:outline-none focus:ring-2 focus:ring-blossom-rose/30"
        />
      </label>

      {error && <p className="text-sm font-bold text-blossom-deeprose">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="plaque-sage w-full px-6 py-3 font-bold uppercase tracking-wide text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}