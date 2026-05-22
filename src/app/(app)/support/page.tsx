// Hub Support — disponible à toute praticienne authentifiée.
// Affiche : démarrer une session (bouton praticienne) + sessions actives à
// rejoindre (Owner ST6 / Admin ST5).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SupportStartButton } from "./start-button";
import { joinSupportSession } from "./actions";
import { takeOnCall, releaseOnCall } from "./oncall-actions";

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
  const reqHeaders = await headers();
  const bearer = reqHeaders.get("x-svlbh-bearer-reader");
  const { data: { user } } = await sb.auth.getUser();
  if (!user && !bearer) redirect("/login");

  // Si user, charger le profil ; si Bearer, charger via svlbh_id du token.
  const { data: me } = user
    ? await sb
        .from("praticienne_profile")
        .select("stx, first_name")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
    : await sb
        .from("praticienne_profile")
        .select("stx, first_name")
        .eq("svlbh_id", bearer!)
        .maybeSingle();

  const isSupporter = me?.stx === "ST5" || me?.stx === "ST6";

  // Astreinte courante : qui est ON_CALL (ended_at IS NULL)
  const { data: rawOnCall } = await sb
    .from("support_on_call")
    .select(`
      id, started_at, note,
      praticienne:svlbh_id (svlbh_id, first_name, last_name, stx)
    `)
    .is("ended_at", null)
    .order("started_at", { ascending: true });
  type OnCallRow = {
    id: string; started_at: string; note: string | null;
    praticienne: { svlbh_id: string; first_name: string | null; last_name: string | null; stx: string | null } | { svlbh_id: string; first_name: string | null; last_name: string | null; stx: string | null }[] | null;
  };
  const onCallList = (rawOnCall ?? []) as unknown as OnCallRow[];
  const onCallPeople = onCallList.map((r) => {
    const p = Array.isArray(r.praticienne) ? r.praticienne[0] : r.praticienne;
    return { id: r.id, started_at: r.started_at, note: r.note, ...p };
  });

  // Mon svlbh_id (si je suis ST5/ST6) pour savoir si je suis d'astreinte
  const { data: myProfile } = user
    ? await sb.from("praticienne_profile").select("svlbh_id").eq("supabase_user_id", user.id).maybeSingle()
    : { data: null };
  const mySvlbhId = myProfile?.svlbh_id ?? null;
  const iAmOnCall = onCallPeople.some((p) => p.svlbh_id === mySvlbhId);

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
  const now = new Date();
  // Filtrage côté UI : sessions encore "actives" = PENDING/ACTIVE ET non
  // expirées (expires_at > now). pg_cron passe les périmées en EXPIRED toutes
  // les 5 min, mais on filtre aussi ici pour éviter le cas inter-cron.
  // DEC Patrick 2026-05-22.
  const active = sessions.filter(
    (s) =>
      (s.status === "PENDING" || s.status === "ACTIVE") &&
      new Date(s.expires_at) > now,
  );
  const recent = sessions
    .filter((s) => {
      if (s.status === "ENDED" || s.status === "EXPIRED") return true;
      // Sessions PENDING/ACTIVE périmées mais pas encore tagged EXPIRED
      // par le cron : on les bascule visuellement dans historique.
      if ((s.status === "PENDING" || s.status === "ACTIVE") && new Date(s.expires_at) <= now) {
        return true;
      }
      return false;
    })
    .slice(0, 10);

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

      {/* ── Astreinte courante (visible à tous) ── */}
      <section
        className={
          "rounded-xl border-2 p-4 " +
          (onCallPeople.length === 0
            ? "border-amber-300 bg-amber-50"
            : "border-emerald-300 bg-emerald-50/60")
        }
      >
        <header className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-base font-bold tracking-tight">
            👥 Astreinte support actuelle
          </h2>
          <span className="text-xs text-neutral-600">
            {onCallPeople.length === 0
              ? "Personne — risque de session non répondue"
              : `${onCallPeople.length} personne${onCallPeople.length > 1 ? "s" : ""} dispo`}
          </span>
        </header>

        {onCallPeople.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            ⚠ Aucune ST5/ST6 d&apos;astreinte actuellement. Une session démarrée
            par une praticienne restera <strong>PENDING</strong> jusqu&apos;à
            ce que quelqu&apos;un la rejoigne manuellement.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {onCallPeople.map((p) => {
              const isMe = p.svlbh_id === mySvlbhId;
              return (
                <li key={p.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="text-emerald-700">🟢</span>
                  <span className="font-semibold text-emerald-900">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.stx && (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-900">
                      {p.stx}
                    </span>
                  )}
                  {isMe && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-900">
                      moi
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-500">
                    depuis {fmtTime(p.started_at)}
                  </span>
                  {p.note && (
                    <span className="text-[11px] italic text-neutral-500">· {p.note}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {isSupporter && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {iAmOnCall ? (
              <form action={releaseOnCall}>
                <button
                  type="submit"
                  className="rounded-md bg-neutral-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-900"
                >
                  🔘 Je passe l&apos;astreinte
                </button>
              </form>
            ) : (
              <form action={takeOnCall} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  name="note"
                  placeholder="Note (optionnel) — ex: 9h-12h"
                  className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  🟢 Je prends l&apos;astreinte
                </button>
              </form>
            )}
            <p className="text-[10px] italic text-neutral-500">
              Multi-personnes autorisé (toi + Anne en parallèle OK).
            </p>
          </div>
        )}
      </section>

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

      {/* Lien diagnostic — ST5+ uniquement */}
      {isSupporter && (
        <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-base font-bold text-sky-900">🩺 Diagnostic technique</h2>
            <p className="text-xs text-sky-800">
              5 mesures auto (RTT, upload, download, NAT, browser) avant ou pendant une session.
            </p>
            <Link
              href="/support/diagnostic"
              className="ml-auto rounded-md bg-sky-700 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-800"
            >
              Ouvrir le diagnostic →
            </Link>
          </div>
        </section>
      )}

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
