import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Statut PostFinance" };
export const dynamic = "force-dynamic";

// Page accessible aux ST5/ST6 humains + Bearer reader avec scope.
// DEC Patrick 2026-05-20.
async function gatePage(): Promise<"bearer" | "owner" | "admin"> {
  const sb = await createClient();
  const reqHeaders = await headers();
  const bearerReaderSvlbhId = reqHeaders.get("x-svlbh-bearer-reader");
  if (bearerReaderSvlbhId) return "bearer";

  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx === "ST6") return "owner";
  if (me?.stx === "ST5") return "admin";
  redirect("/dashboard");
}

type InvoiceRow = {
  invoice_id: string;
  numero: string | null;
  status: string | null;
  issue_date: string | null;
  paid_at: string | null;
  sent_at: string | null;
  total: number | null;
  currency: string | null;
  payment_method: string | null;
  rf_reference: string | null;
};

const STATUS_TONE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  SENT: "bg-amber-100 text-amber-900",
  DRAFT: "bg-neutral-100 text-neutral-700",
  OVERDUE: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-neutral-200 text-neutral-600",
};

function fmtCHF(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StatutsPostFinancePage() {
  await gatePage();

  const sb = await createClient();

  // Stats globales
  const { data: allInvoices } = await sb
    .from("invoice")
    .select(
      "invoice_id, numero, status, issue_date, paid_at, sent_at, total, currency, payment_method, rf_reference",
    )
    .order("issue_date", { ascending: false });

  const invoices = (allInvoices ?? []) as InvoiceRow[];
  const paid = invoices.filter((i) => i.status === "PAID");
  const sent = invoices.filter((i) => i.status === "SENT");
  const overdue = invoices.filter((i) => i.status === "OVERDUE");
  const draft = invoices.filter((i) => i.status === "DRAFT");

  const totalPaid = paid.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalPending = sent.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalOverdue = overdue.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

  const lastPaid = paid[0]; // déjà trié desc par issue_date
  const recentPaid = paid.slice(0, 10);

  // Health PostFinance — heuristique simple : a-t-on au moins 1 paiement récent (<= 30j) ?
  const now = Date.now();
  const recentPaidWindow = paid.filter((i) => {
    if (!i.paid_at) return false;
    return now - new Date(i.paid_at).getTime() < 30 * 24 * 3600 * 1000;
  });
  const isHealthy = recentPaidWindow.length > 0 || paid.length === 0; // no signal = pas d'alerte

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link
        href="/dashboard"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Cockpit
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST5/ST6 · Owner Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          🏦 Statut PostFinance
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          État de la solution bancaire suisse (PostFinance Checkout) — paiements
          des factures consultantes via QR-bill et carte. {invoices.length}{" "}
          facture{invoices.length > 1 ? "s" : ""} au total.
        </p>
      </header>

      {/* Health du service */}
      <section
        className={`flex items-baseline gap-3 rounded-xl border-2 p-4 ${
          isHealthy
            ? "border-emerald-300 bg-emerald-50"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full ${
            isHealthy ? "bg-emerald-500" : "bg-amber-500"
          }`}
          aria-hidden
        />
        <div className="flex-1">
          <p
            className={`text-sm font-bold ${
              isHealthy ? "text-emerald-900" : "text-amber-900"
            }`}
          >
            {isHealthy ? "Service opérationnel" : "⚠ Aucun paiement récent"}
          </p>
          <p className="text-xs text-neutral-700">
            {recentPaidWindow.length} paiement{recentPaidWindow.length > 1 ? "s" : ""}{" "}
            encaissé{recentPaidWindow.length > 1 ? "s" : ""} sur les 30 derniers jours.
            {lastPaid?.paid_at &&
              ` Dernier : ${fmtDate(lastPaid.paid_at)} · ${fmtCHF(lastPaid.total)}.`}
          </p>
        </div>
      </section>

      {/* Stats globales */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="✓ Encaissées"
          value={`${paid.length}`}
          sub={fmtCHF(totalPaid)}
          tone="emerald"
        />
        <StatCard
          label="⏳ Envoyées"
          value={`${sent.length}`}
          sub={fmtCHF(totalPending)}
          tone="amber"
        />
        <StatCard
          label="⚠ En retard"
          value={`${overdue.length}`}
          sub={fmtCHF(totalOverdue)}
          tone="rose"
        />
        <StatCard
          label="📝 Brouillons"
          value={`${draft.length}`}
          sub="non émises"
          tone="neutral"
        />
      </section>

      {/* Liste des 10 derniers paiements */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-700">
          10 derniers paiements encaissés
        </h2>
        {recentPaid.length === 0 ? (
          <p className="mt-2 text-sm italic text-neutral-400">
            Aucun paiement encaissé pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {recentPaid.map((i) => {
              const tone =
                STATUS_TONE[i.status ?? ""] ?? "bg-neutral-100 text-neutral-700";
              return (
                <li
                  key={i.invoice_id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <code className="font-mono text-xs text-neutral-500">
                    {i.numero ?? "—"}
                  </code>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}
                  >
                    {i.status}
                  </span>
                  <span className="font-mono text-xs text-neutral-700">
                    {fmtDate(i.paid_at)}
                  </span>
                  <span className="ml-auto font-mono text-sm font-semibold text-neutral-900">
                    {fmtCHF(i.total)}
                  </span>
                  {i.payment_method && (
                    <span className="text-[10px] text-neutral-500">
                      {i.payment_method}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Infos pratiques */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard
          title="🏦 PostFinance Merchant"
          desc="Portail commerçant pour consulter les transactions, exporter les relevés et gérer les remboursements."
          href="https://merchant.postfinance.ch"
          linkLabel="Ouvrir Merchant →"
        />
        <InfoCard
          title="📜 DPA / Protection des données"
          desc="Infra suisse 100%. Régulé FINMA. PCI-DSS géré par PostFinance — aucune donnée carte côté SVLBH."
          href="https://www.postfinance.ch/fr/clients-commerciaux/produits-services-numeriques/protection-des-donnees.html"
          linkLabel="Voir DPA →"
        />
        <InfoCard
          title="🇨🇭 Hébergement données"
          desc="Toutes les transactions et données paiement restent en Suisse (PostFinance + iTherapeut). Aucun transfert hors CH/UE."
        />
        <InfoCard
          title="📋 Audit log"
          desc="Toutes les opérations de facturation sont tracées dans audit_log Compliance."
          href="/compliance/audit-log?table=invoice"
          linkLabel="Voir log →"
        />
      </section>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Note V1.</strong> Cette page lit les invoices Supabase et infère
        le statut PostFinance via <code>status</code> + <code>paid_at</code>.
        V2 : connexion directe à l&apos;API PostFinance Merchant pour
        rapprochement automatique + alerting échecs paiement.
      </footer>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "amber" | "rose" | "neutral";
}) {
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    rose: "border-rose-200 bg-rose-50",
    neutral: "border-neutral-200 bg-neutral-50",
  }[tone];
  return (
    <div className={`rounded-xl border-2 p-3 ${colors}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-700">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-neutral-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-neutral-600">{sub}</p>
    </div>
  );
}

function InfoCard({
  title,
  desc,
  href,
  linkLabel,
}: {
  title: string;
  desc: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="font-bold text-blue-950">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-700">{desc}</p>
      {href && linkLabel && (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline"
        >
          {linkLabel}
        </a>
      )}
    </div>
  );
}
