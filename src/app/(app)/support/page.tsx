// Hub Support — disponible à toute praticienne authentifiée.
// Affiche : démarrer une session (bouton praticienne) + sessions actives à
// rejoindre (Owner ST6 / Admin ST5).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportStartButton } from "./start-button";
import { joinSupportSession } from "./actions";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

type Session = {
  id: string;
  room_id: string;
  status: string;
  praticienne_svlbh_id: string;
  owner_svlbh_id: string | null;
  started_at: string;
  joined_at: string | null;
  ended_at: string | null;
  expires_at: string;
  note: string | null;
  praticienne: { first_name: string | null; last_name: string | null; code_praticien: number | null } | null;
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-CH", { day: "numeric", month: "short" });
}

export default async function SupportHubPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx, first_name")
    .eq("supabase_user_id", user.id)
    .maybeSingle();

  const isSupporter = me?.stx === "ST5" || me?.stx === "ST6";

  // Sessions visibles : RLS filtre déjà — la praticienne voit les siennes,
  // Owner/Admin voient tout.
  const { data: rawSessions } = await sb
    .from("support_session")
    .select(`
      id, room_id, status, praticienne_svlbh_id, owner_svlbh_id,
      started_at, joined_at, ended_at, expires_at, note,
      praticienne:praticienne_svlbh_id (first_name, last_name, code_praticien)
    `)
    .order("started_at", { ascending: false })
    .limit(30);

  const sessions = (rawSessions ?? []) as unknown as Session[];
  const active = sessions.filter((s) => s.status === "PENDING" || s.status === "ACTIVE");
  const recent = sessions.filter((s) => s.status === "ENDED" || s.status === "EXPIRED").slice(0, 10);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Cockpit
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          💬 Support
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Sessions de co-browsing en temps réel (rendu de votre onglet
          navigateur) entre praticiennes et Owner ST6 / Admin ST5. Données
          100% suisses, WebRTC peer-to-peer.
        </p>
      </header>

      {/* Démarrer une session (toutes praticiennes) */}
      <section className="rounded-xl border-2 border-blue-200 bg-blue-50/40 p-5">
        <h2 className="text-base font-bold text-blue-950">
          Besoin d&apos;aide ? Partagez votre écran avec un Owner ou Admin.
        </h2>
        <p className="mt-1 text-xs text-blue-800">
          Consentement explicite requis (LPD/RGPD), session 60 min max,
          arrêtable à tout moment.
        </p>
        <div className="mt-3">
          <SupportStartButton />
        </div>
      </section>

      {/* Sessions actives à rejoindre (Owner/Admin) */}
      {isSupporter && (
        <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50/40 p-5">
          <h2 className="text-base font-bold text-emerald-900">
            🔴 Sessions actives ({active.length})
          </h2>
          <p className="mt-1 text-xs text-emerald-800">
            En tant que <strong>{me?.stx}</strong>, vous pouvez rejoindre une session ouverte.
          </p>
          {active.length === 0 ? (
            <p className="mt-3 text-sm italic text-neutral-500">
              Aucune session ouverte pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {active.map((s) => {
                const expires = new Date(s.expires_at);
                const isExpired = expires < new Date();
                return (
                  <li
                    key={s.id}
                    className="rounded-lg border border-emerald-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-bold text-blue-950">
                        {s.praticienne?.first_name ?? "?"}{" "}
                        {s.praticienne?.last_name ?? ""}
                      </span>
                      {s.praticienne?.code_praticien != null && (
                        <span className="font-mono text-[10px] text-neutral-500">
                          #{String(s.praticienne.code_praticien).padStart(5, "0")}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {s.status === "ACTIVE" ? "🟢 ACTIVE" : "🟡 PENDING (en attente)"}
                      </span>
                      <span className="text-xs text-neutral-600">
                        démarrée {fmtTime(s.started_at)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        expire {fmtTime(s.expires_at)}
                      </span>
                      <form action={joinSupportSession} className="ml-auto">
                        <input type="hidden" name="session_id" value={s.id} />
                        <button
                          type="submit"
                          disabled={isExpired}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                        >
                          {s.status === "ACTIVE" ? "Reprendre" : "Rejoindre"} →
                        </button>
                      </form>
                    </div>
                    {s.note && (
                      <p className="mt-1 text-xs italic text-neutral-600">{s.note}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Sessions terminées (historique) */}
      {recent.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-700">
            Historique récent ({recent.length})
          </h2>
          <ul className="mt-2 divide-y divide-neutral-100">
            {recent.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-xs"
              >
                <span className="text-neutral-700">
                  {s.praticienne?.first_name ?? "?"} {s.praticienne?.last_name ?? ""}
                </span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                  {s.status}
                </span>
                <span className="text-neutral-500">
                  {fmtDate(s.started_at)} {fmtTime(s.started_at)}
                  {s.ended_at && ` → ${fmtTime(s.ended_at)}`}
                </span>
                {s.note && <span className="italic text-neutral-500">· {s.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>V1 — UI shell.</strong> WebRTC peer-to-peer signaling via
        Supabase Realtime à activer dans la Phase 3. Pour l&apos;instant, le
        consentement est consigné et l&apos;événement tracé dans audit_log,
        mais le partage d&apos;écran live n&apos;est pas encore branché.
      </footer>
    </main>
  );
}
