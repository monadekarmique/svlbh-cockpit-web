import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

type Module = {
  href: string;
  label: string;
  icon: string;
  status: "ready" | "wip" | "todo";
  desc: string;
};

const MODULES: Module[] = [
  {
    href: "/compliance/sous-traitants",
    label: "Sous-traitants + DPA",
    icon: "🏛️",
    status: "ready",
    desc: "Inventaire des sous-traitants (Render, Supabase, Make.com, Apple, Cloudflare, GitHub, OneDoc, AssemblyAI, Asana) + statut DPA, région données, finalité.",
  },
  {
    href: "/compliance/audit-log",
    label: "Audit log",
    icon: "📜",
    status: "ready",
    desc: "Lecture du journal audit_log (Supabase) — qui a vu/modifié quoi. Owner ST6 seulement.",
  },
  {
    href: "/compliance/cadre-legal",
    label: "Cadre légal SVLBH",
    icon: "⚖️",
    status: "todo",
    desc: "Doctrine : vibrations transgénérationnelles ≠ données patient (hors Art. 9 RGPD), périmètre, bases légales, durée conservation, exclusion santé.",
  },
  {
    href: "/compliance/registre",
    label: "Registre Art. 30 RGPD",
    icon: "📑",
    status: "todo",
    desc: "Registre des traitements par finalité (auth, soins vibratoires, facturation, pédagogie ST4) + bases légales + durée + flux.",
  },
];

const STATUS_TONE: Record<Module["status"], { label: string; bg: string }> = {
  ready: { label: "✓ Disponible", bg: "bg-emerald-100 text-emerald-800" },
  wip: { label: "⋯ En cours", bg: "bg-amber-100 text-amber-800" },
  todo: { label: "○ À construire", bg: "bg-neutral-100 text-neutral-600" },
};

export default async function CompliancePage() {
  await requireOwner();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Outils Owner pour la conformité SVLBH — gouvernance technique, RGPD,
          inventaire prestataires. Cadrage doctrinal : les vibrations
          transgénérationnelles ne sont pas des données patient au sens de l&apos;Art. 9 RGPD.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODULES.map((m) => {
          const tone = STATUS_TONE[m.status];
          const card = (
            <div
              className={`flex h-full flex-col gap-2 rounded-xl border-2 p-4 transition ${
                m.status === "ready"
                  ? "border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm"
                  : "border-dashed border-neutral-200 bg-neutral-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="font-bold text-blue-950">{m.label}</span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.bg}`}
                >
                  {tone.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-700">{m.desc}</p>
            </div>
          );

          return (
            <li key={m.href}>
              {m.status === "ready" ? (
                <Link href={m.href} className="block">
                  {card}
                </Link>
              ) : (
                <div aria-disabled="true">{card}</div>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Périmètre Owner ST6.</strong> Cette section n&apos;est accessible
        qu&apos;à Patrick (gate <code>requireOwner</code>). Les exports DPIA et
        registre Art. 30 sont des documents internes — pas de transmission
        externe sans validation explicite.
      </footer>
    </main>
  );
}
