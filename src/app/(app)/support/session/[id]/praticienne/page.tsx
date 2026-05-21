// Vue praticienne : sender (= elle partage son tab via getDisplayMedia).
// Phase 2 = skeleton sans WebRTC. Phase 3 branchera getDisplayMedia +
// RTCPeerConnection + signaling Supabase Realtime.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { endSupportSession } from "../../../actions";

export const metadata: Metadata = { title: "Ma session support" };
export const dynamic = "force-dynamic";

export default async function MyPraticienneSessionPage({
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

  const { data: me } = user
    ? await sb
        .from("praticienne_profile")
        .select("svlbh_id, first_name")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
    : { data: { svlbh_id: bearer!, first_name: null as string | null } };
  if (!me) redirect("/dashboard");

  const { data: session } = await sb
    .from("support_session")
    .select(`
      id, room_id, status, praticienne_svlbh_id, owner_svlbh_id,
      started_at, joined_at, ended_at, expires_at, consent_at, note,
      owner:owner_svlbh_id (first_name, last_name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();
  // Garde-fou : c'est bien la session de l'utilisateur courant
  // (skip si Bearer reader — déjà scopé par le middleware via allowed_paths)
  if (!bearer && session.praticienne_svlbh_id !== me.svlbh_id) {
    redirect("/support");
  }

  type Owner = { first_name: string | null; last_name: string | null };
  const owner = (Array.isArray(session.owner) ? session.owner[0] : session.owner) as Owner | null;
  const isEnded = session.status === "ENDED" || session.status === "EXPIRED";

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link href="/support" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Support
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          💬 Ma session de support
        </h1>
        <p className="text-xs text-neutral-500">
          room_id <code>{session.room_id}</code>
        </p>
      </header>

      {/* Statut très visible */}
      {isEnded ? (
        <section className="rounded-xl border-2 border-neutral-300 bg-neutral-50 p-5">
          <p className="text-lg font-bold text-neutral-700">
            🔘 Session terminée
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Partage arrêté à{" "}
            {session.ended_at &&
              new Date(session.ended_at).toLocaleTimeString("fr-CH")}
            . Aucun enregistrement n&apos;a été conservé.
          </p>
        </section>
      ) : session.status === "PENDING" ? (
        <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
          <p className="text-lg font-bold text-amber-900">
            🟡 En attente — Owner / Admin va rejoindre
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Une notification a été envoyée. Patrick ou Anne va se connecter
            dans quelques secondes. Vous pouvez préparer l&apos;onglet à
            partager.
          </p>
        </section>
      ) : (
        <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <p className="text-lg font-bold text-emerald-900">
            🔴 Session active — {owner?.first_name ?? "Owner"}{" "}
            {owner?.last_name ?? ""} voit votre onglet
          </p>
          <p className="mt-1 text-xs text-emerald-800">
            Partage actif depuis{" "}
            {session.joined_at &&
              new Date(session.joined_at).toLocaleTimeString("fr-CH")}
            . Vous restez maître — bouton STOP ci-dessous.
          </p>
        </section>
      )}

      {/* Bouton STOP très visible */}
      {!isEnded && (
        <section className="flex items-center gap-3">
          <form action={endSupportSession}>
            <input type="hidden" name="session_id" value={id} />
            <input type="hidden" name="ended_by" value="PRATICIENNE" />
            <button
              type="submit"
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-rose-700"
            >
              ⛔ Arrêter le partage MAINTENANT
            </button>
          </form>
          <p className="text-xs text-neutral-500">
            Expire automatiquement à{" "}
            {new Date(session.expires_at).toLocaleTimeString("fr-CH")}
          </p>
        </section>
      )}

      {/* Zone partage écran — Phase 3 */}
      <section className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <p className="text-4xl">🖥️</p>
        <p className="mt-3 font-bold text-neutral-700">
          Partage d&apos;onglet (Phase 3 — WebRTC à brancher)
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Quand Phase 3 sera livrée, un bouton « Partager mon onglet »
          ouvrira le picker natif du navigateur (Chrome / Safari / Firefox).
          Vous choisirez quel onglet partager — le rendu sera transmis en
          peer-to-peer (WebRTC) à Patrick / Anne.
        </p>
      </section>

      {session.note && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs italic text-amber-900">
          <strong>Note :</strong> {session.note}
        </section>
      )}
    </main>
  );
}
