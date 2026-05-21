// Vue Owner / Admin : receiver d'une session de co-browsing.
// Phase 2 = skeleton sans WebRTC réel. Phase 3 branchera RTCPeerConnection
// + Supabase Realtime signaling.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { endSupportSession } from "../../actions";

export const metadata: Metadata = { title: "Session support" };
export const dynamic = "force-dynamic";

export default async function SupportSessionViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sb = await createClient();
  const reqHeaders = await headers();
  const bearer = reqHeaders.get("x-svlbh-bearer-reader");
  const { data: { user } } = await sb.auth.getUser();
  if (!user && !bearer) redirect("/login");

  // Gate Owner/Admin (sauf Bearer reader — déjà validé par le middleware)
  if (!bearer) {
    const { data: me } = await sb
      .from("praticienne_profile")
      .select("stx, svlbh_id")
      .eq("supabase_user_id", user!.id)
      .maybeSingle();
    if (!me || (me.stx !== "ST5" && me.stx !== "ST6")) {
      redirect("/dashboard");
    }
  }

  const { data: session } = await sb
    .from("support_session")
    .select(`
      id, room_id, status, praticienne_svlbh_id, owner_svlbh_id,
      started_at, joined_at, ended_at, expires_at, consent_at, consent_text, note,
      praticienne:praticienne_svlbh_id (first_name, last_name, code_praticien, email)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  type Praticienne = { first_name: string | null; last_name: string | null; code_praticien: number | null; email: string | null };
  const prat = (Array.isArray(session.praticienne) ? session.praticienne[0] : session.praticienne) as Praticienne | null;

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Link href="/support" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Support
      </Link>

      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">
            🎥 Session avec {prat?.first_name ?? "?"} {prat?.last_name ?? ""}
          </h1>
          <p className="text-xs text-neutral-500">
            room_id <code>{session.room_id}</code>
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            session.status === "ACTIVE"
              ? "bg-emerald-100 text-emerald-800"
              : session.status === "PENDING"
              ? "bg-amber-100 text-amber-900"
              : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {session.status}
        </span>
        {session.status !== "ENDED" && session.status !== "EXPIRED" && (
          <form action={endSupportSession} className="ml-auto">
            <input type="hidden" name="session_id" value={id} />
            <input type="hidden" name="ended_by" value="OWNER" />
            <button
              type="submit"
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              ⛔ Terminer la session
            </button>
          </form>
        )}
      </header>

      {/* Métadonnées */}
      <section className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Meta label="Démarrée">
          {new Date(session.started_at).toLocaleTimeString("fr-CH")}
        </Meta>
        <Meta label="Joined">
          {session.joined_at
            ? new Date(session.joined_at).toLocaleTimeString("fr-CH")
            : "—"}
        </Meta>
        <Meta label="Expire">
          {new Date(session.expires_at).toLocaleTimeString("fr-CH")}
        </Meta>
        <Meta label="Praticienne">
          {prat?.code_praticien != null ? `#${prat.code_praticien}` : "—"}{" "}
          <span className="text-neutral-500">{prat?.email}</span>
        </Meta>
      </section>

      {/* Note de session */}
      {session.note && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs italic text-amber-900">
          <strong>Note :</strong> {session.note}
        </section>
      )}

      {/* Consentement (preuve) */}
      <details className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 text-xs">
        <summary className="cursor-pointer font-semibold text-violet-900">
          📜 Consentement RGPD/LPD ({session.consent_at && new Date(session.consent_at).toLocaleString("fr-CH")})
        </summary>
        <p className="mt-2 italic text-neutral-700">{session.consent_text}</p>
      </details>

      {/* Zone vidéo — Phase 3 WebRTC */}
      <section className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <p className="text-4xl">📺</p>
        <p className="mt-3 font-bold text-neutral-700">
          Zone partage d&apos;écran (Phase 3 — WebRTC à brancher)
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Phase 2 : UI shell livré. Phase 3 livrera le branchement
          <code className="mx-1">RTCPeerConnection</code>+ signaling via Supabase
          Realtime sur le channel <code>{session.room_id}</code>.
        </p>
      </section>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>V1 Phase 2 — UI shell.</strong> La session est consignée
        (audit_log via trigger), le consentement de la praticienne est
        archivé. Reste à brancher Phase 3 (WebRTC) pour que le rendu de
        l&apos;onglet praticienne apparaisse ici en live.
      </footer>
    </main>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-800">{children}</p>
    </div>
  );
}
