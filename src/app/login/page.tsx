"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: "google" | "apple") {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold tracking-tight">SVLBH Pro 1</h1>
          <p className="text-sm text-neutral-500">Connexion praticienne</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("apple")}
            disabled={loading !== null}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading === "apple" ? "…" : "Se connecter avec Apple"}
          </button>
          <button
            type="button"
            onClick={() => signIn("google")}
            disabled={loading !== null}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading === "google" ? "…" : "Se connecter avec Google"}
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </main>
  );
}
