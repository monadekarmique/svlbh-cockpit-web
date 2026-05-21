// Page diagnostic technique — restreinte ST5+ (Admin/Owner) — DEC Patrick 2026-05-21 v3.
// Praticiennes ST1-ST4 ne voient ni le link nav ni la page (redirect /dashboard).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DiagnosticPanel } from "./panel";

export const metadata: Metadata = { title: "Diagnostic technique · Support" };
export const dynamic = "force-dynamic";

export default async function SupportDiagnosticPage() {
  const sb = await createClient();
  const reqHeaders = await headers();
  const bearer = reqHeaders.get("x-svlbh-bearer-reader");
  const { data: { user } } = await sb.auth.getUser();
  if (!user && !bearer) redirect("/login");

  // Gate ST5+ (skip si Bearer reader — scope déjà filtré middleware)
  if (!bearer) {
    const { data: me } = await sb
      .from("praticienne_profile")
      .select("stx")
      .eq("supabase_user_id", user!.id)
      .maybeSingle();
    if (!me || (me.stx !== "ST5" && me.stx !== "ST6")) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Link href="/support" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Support
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST5/ST6 · Admin / Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          🩺 Diagnostic technique
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          5 mesures automatiques (RTT, upload, download, NAT, browser+codec)
          pour valider la capacité d&apos;une session de co-browsing. Résultats
          consignés dans <Link href="/compliance/audit-log?action=DIAGNOSTIC" className="underline">audit_log</Link>.
        </p>
      </header>

      <DiagnosticPanel />

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Périmètre ST5+.</strong> Cette page est restreinte aux ST5
        (Admin) et ST6 (Owner). Les praticiennes ST1-ST4 ne voient ni le
        link ni la page (redirect vers <code>/dashboard</code>). Raison :
        l&apos;interprétation des métriques réseau / NAT type / codecs
        demande des connaissances qui dépassent le périmètre d&apos;une
        praticienne en formation.
      </footer>
    </main>
  );
}
