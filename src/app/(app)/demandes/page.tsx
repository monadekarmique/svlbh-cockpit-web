// Demandes — portail client factures + sessions (port DemandesView.swift).
// V2 : structure + lien vers vlbh-energy-mcp. Le fetch live nécessite un
// token vlbh_token (stocké côté client) et l'API iTherapeut 6.0.

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DemandesPage() {
  return (
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Cockpit
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          📥 Demandes
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Workflow réception des demandes patient — factures, sessions,
          historique. Source API : vlbh-energy-mcp (iTherapeut 6.0).
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ChannelCard
          icon="🧾"
          title="Factures"
          desc="Brouillons · envoyées · payées · en retard · annulées"
          color="#1D9E75"
        />
        <ChannelCard
          icon="📅"
          title="Sessions"
          desc="Historique des thérapies par patient avec statut"
          color="#2B5EA7"
        />
        <ChannelCard
          icon="👤"
          title="Profil patient"
          desc="Données de contact + parcours + assurances"
          color="#7C3AED"
        />
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">⏳ V2 — structure</p>
        <p className="mt-1 text-xs">
          V3 ajoutera : <code className="font-mono">fetch</code> live des
          factures + sessions via API <code>vlbh-energy-mcp.onrender.com</code>{" "}
          (token <code>vlbh_token</code> en localStorage), preview PDF facture
          inline, génération nouvelle facture/session.
        </p>
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <p className="font-bold">🔗 Endpoints API existants</p>
        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs font-mono">
          <li>GET /invoices?patient_id=...</li>
          <li>GET /invoices/:id</li>
          <li>GET /invoices/:id/pdf</li>
          <li>GET /therapy-sessions?patient_id=...</li>
          <li>GET /patients/:id</li>
        </ul>
      </section>
    </div>
  );
}

function ChannelCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <article
      className="rounded-2xl border bg-white p-5 shadow-sm"
      style={{ borderTopColor: color, borderTopWidth: 4 }}
    >
      <p className="text-2xl">{icon}</p>
      <h2 className="mt-2 text-base font-semibold" style={{ color }}>
        {title}
      </h2>
      <p className="mt-1 text-xs text-neutral-600">{desc}</p>
    </article>
  );
}
