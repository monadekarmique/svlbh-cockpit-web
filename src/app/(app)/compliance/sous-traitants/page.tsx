import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Sous-traitants + DPA · Compliance" };
export const dynamic = "force-dynamic";

type DpaStatus = "click-through" | "signed" | "scc" | "na";
type Region = "CH" | "EU-DE" | "EU-CH" | "EU-NL" | "US" | "Mixte";

type SubProcessor = {
  name: string;
  finalite: string;
  donnees: string;
  region: Region;
  dpa: DpaStatus;
  note?: string;
  doc?: string;
};

// Source : CLAUDE.md + memory (feedback_dpa_clickthrough.md, reference_render_api.md,
// project_svlbh_pro1_billing_stack.md, reference_bridges_whatsapp_z4.md, etc.)
const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: "Supabase",
    finalite: "Base de données principale (Auth, Postgres, Storage, RLS)",
    donnees: "Profils praticiennes, sessions, healing-path, relations",
    region: "EU-DE",
    dpa: "signed",
    note: "Projet qodnztqsawsofimbsfhb (svlbh-pro-1-dev). RLS activée sur 5 tables session_* critiques.",
    doc: "https://supabase.com/legal/dpa",
  },
  {
    name: "Render",
    finalite: "Hébergement web (4 PWA + bridges)",
    donnees: "Logs HTTP, déploys, build artifacts (pas de données persistantes utilisateur)",
    region: "EU-DE",
    dpa: "click-through",
    note: "DPA self-executing click-through (cf. memory feedback_dpa_clickthrough.md) — pas de signature à faire.",
    doc: "https://render.com/legal/dpa",
  },
  {
    name: "Make.com",
    finalite: "Automatisations (hotline, magic links, scénarios datastore)",
    donnees: "Identifiants email/téléphone, déclencheurs auth, transferts datastore",
    region: "EU-NL",
    dpa: "signed",
    note: "Team 630342, région eu2 (hook.eu2.make.com). SCC en place.",
    doc: "https://www.make.com/en/dpa",
  },
  {
    name: "Apple",
    finalite: "Apple Sign-In (Auth ID provider) + App Store Connect",
    donnees: "Email (potentiellement aliasé via Hide My Email), nom",
    region: "Mixte",
    dpa: "scc",
    note: "Hide My Email crée des alias *.privaterelay.appleid.com. Clé Key ID RX7LGUV2K4 (Services ID).",
  },
  {
    name: "Cloudflare",
    finalite: "CDN + Cloudflare Access (zero-trust priv/pro/cockpit)",
    donnees: "Logs HTTP, headers Access JWT, IPs",
    region: "Mixte",
    dpa: "signed",
    note: "Service Token make-z4-bridge (CF-Access-Client-Id/Secret) pour Make → z4-bridge.svlbh.com.",
    doc: "https://www.cloudflare.com/cloudflare-customer-dpa/",
  },
  {
    name: "GitHub (Microsoft)",
    finalite: "Hébergement code source + CI/CD",
    donnees: "Code, commits, secrets chiffrés (PATs, API keys, certs Apple p8)",
    region: "US",
    dpa: "scc",
    note: "Repos privés monadekarmique/* (svlbh-pro-web, svlbh-priv-web, svlbh-cockpit-web, etc.).",
    doc: "https://docs.github.com/en/site-policy/privacy-policies/github-data-protection-agreement",
  },
  {
    name: "OneDoc.ch",
    finalite: "Prise de rendez-vous praticiennes ASCA",
    donnees: "Matcher AVS, agenda, RDV (sandbox actuellement)",
    region: "CH",
    dpa: "signed",
    note: "Sandbox OK, API non self-service (cf. memory project_onedoc_integration.md). Testeuse alpha Anne #302.",
  },
  {
    name: "AssemblyAI",
    finalite: "Transcription audio (uploads consultations audio)",
    donnees: "Audio + texte transcrit (suppression après traitement)",
    region: "US",
    dpa: "scc",
    note: "Clé API stockée dans 1Password Patrick. Usage ponctuel — pas de pipeline automatique.",
  },
  {
    name: "Asana",
    finalite: "Gestion des tâches PO + portfolio SVLBH Release Train",
    donnees: "Tâches métier (pas de données utilisateurs SVLBH)",
    region: "US",
    dpa: "scc",
    note: "Workspace VLBH 1214046872168643. Pas de donnée de soin / vibration dans Asana.",
  },
  {
    name: "Meta (WhatsApp)",
    finalite: "Canal de communication (4 bridges z1-z4)",
    donnees: "Numéros + messages WhatsApp (transitent par Meta avant le bridge — pas stockés côté SVLBH)",
    region: "Mixte",
    dpa: "na",
    note: "Bridges Go natifs sur Mac patricktest, persistance limitée (/tmp/wa_media). Meta = canal, pas sous-traitant data.",
  },
  {
    name: "iTherapeut (vlbh-energy-mcp)",
    finalite: "Facturation + sessions live API",
    donnees: "Factures, sessions, tarifs",
    region: "CH",
    dpa: "na",
    note: "Infra propre Patrick — pas de sous-traitance externe.",
  },
  {
    name: "Stripe",
    finalite: "Paiements (programme ST1, abonnements)",
    donnees: "Données paiement (PCI-DSS gérées par Stripe, jamais côté SVLBH)",
    region: "Mixte",
    dpa: "signed",
    note: "Connecté via Make.com pour les flux ST1.",
    doc: "https://stripe.com/legal/dpa",
  },
];

const DPA_TONE: Record<DpaStatus, { label: string; bg: string }> = {
  signed: { label: "✓ Signé", bg: "bg-emerald-100 text-emerald-800" },
  "click-through": { label: "✓ Click-through", bg: "bg-emerald-100 text-emerald-800" },
  scc: { label: "SCC", bg: "bg-amber-100 text-amber-900" },
  na: { label: "N/A", bg: "bg-neutral-100 text-neutral-600" },
};

const REGION_FLAG: Record<Region, string> = {
  CH: "🇨🇭",
  "EU-DE": "🇩🇪",
  "EU-CH": "🇨🇭",
  "EU-NL": "🇳🇱",
  US: "🇺🇸",
  Mixte: "🌍",
};

export default async function SousTraitantsPage() {
  await requireOwner();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link
        href="/compliance"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Compliance
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner · Compliance
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          🏛️ Sous-traitants + DPA
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Inventaire des sous-traitants techniques SVLBH avec leur statut DPA,
          région d&apos;hébergement et finalité. {SUB_PROCESSORS.length} entrées
          au {new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </header>

      <ul className="space-y-3">
        {SUB_PROCESSORS.map((sp) => {
          const dpa = DPA_TONE[sp.dpa];
          return (
            <li
              key={sp.name}
              className="rounded-xl border-2 border-neutral-200 bg-white p-4 transition hover:border-blue-300"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-bold text-blue-950">{sp.name}</span>
                <span className="text-xs text-neutral-600">
                  {REGION_FLAG[sp.region]} {sp.region}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dpa.bg}`}
                >
                  DPA · {dpa.label}
                </span>
                {sp.doc && (
                  <a
                    href={sp.doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[11px] font-medium text-blue-700 hover:underline"
                  >
                    DPA officiel ↗
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-neutral-800">
                {sp.finalite}
              </p>
              <p className="mt-0.5 text-xs text-neutral-700">
                <strong className="text-neutral-500">Données : </strong>
                {sp.donnees}
              </p>
              {sp.note && (
                <p className="mt-1 text-[11px] italic leading-relaxed text-neutral-600">
                  {sp.note}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Légende DPA.</strong>{" "}
        <span className="font-semibold">✓ Signé</span> = contrat signé bilatéral ·{" "}
        <span className="font-semibold">✓ Click-through</span> = DPA
        self-executing (validé par usage du service) ·{" "}
        <span className="font-semibold">SCC</span> = clauses contractuelles types
        UE pour transferts hors UE ·{" "}
        <span className="font-semibold">N/A</span> = pas applicable (canal, infra
        propre).
      </footer>
    </main>
  );
}
