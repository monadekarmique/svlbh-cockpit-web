// Vue praticienne : sender (= elle partage son tab via getDisplayMedia).
// Phase 3 WebRTC + masquage v3 livrés. REFACTOR Patrick 2026-05-21 :
// les actions Masquer + Arrêter sont dans le banner sticky du SenderClient
// (toujours visibles en haut de la page), plus dans cette page server.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PraticienneSenderClient } from "./sender";

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

      {/* Phase 3 — WebRTC sender avec banner sticky en haut
          (statut + bouton Masquer + bouton Arrêter toujours visibles) */}
      <PraticienneSenderClient
        sessionId={id}
        roomId={session.room_id}
        isEnded={isEnded}
        expiresAt={session.expires_at}
      />

      {session.note && (
        <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs italic text-amber-900">
          <strong>Note :</strong> {session.note}
        </section>
      )}
    </main>
  );
}
