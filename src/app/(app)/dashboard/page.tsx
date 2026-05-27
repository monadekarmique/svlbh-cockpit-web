// Cockpit Dashboard — Hub des modules Cercle de Lumière.
// Source de vérité ordre/contenu : src/lib/cockpit-nav.ts

import Link from "next/link";
import { COCKPIT_NAV } from "@/lib/cockpit-nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // L'Owner ST6 masque l'en-tête d'accueil — il connaît déjà le cockpit.
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  let stx: string | null = null;
  if (user) {
    const { data: me } = await sb
      .from("praticienne_profile")
      .select("stx")
      .eq("supabase_user_id", user.id)
      .maybeSingle();
    stx = (me?.stx as string | null) ?? null;
  }
  const hideWelcome = stx === "ST6";

  return (
    <div className="space-y-6">
      {!hideWelcome && (
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Cockpit MyShamanFamily
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
            Routines ◉ de Lumière
          </h1>
          <p className="mt-2 text-neutral-700">
            Pilotage quotidien des routines + suivi des shamanes du cercle.
          </p>
        </header>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COCKPIT_NAV.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="text-3xl">{t.icon}</div>
            <h2
              className="mt-3 text-lg font-semibold"
              style={{ color: t.color }}
            >
              {t.label}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
