import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import { markInvoicePaid } from "./actions";

export const metadata: Metadata = { title: "Facturation" };
export const dynamic = "force-dynamic";

type Invoice = {
  invoice_id: string;
  numero: string | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  paid_at: string | null;
  total: number | null;
  currency: string | null;
  payment_method: string | null;
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

export default async function FacturationPage() {
  await requireOwner();

  const sb = await createClient();
  const { data, error } = await sb
    .from("invoice")
    .select("invoice_id, numero, status, issue_date, due_date, paid_at, total, currency, payment_method")
    .order("issue_date", { ascending: false })
    .limit(50);

  const invoices = (data ?? []) as Invoice[];
  const unpaid = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
  const recent = invoices.slice(0, 20);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Cockpit
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          💰 Facturation
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Gestion des factures consultantes — émissions, paiements PostFinance, exports.
          Toutes les actions sont tracées dans{" "}
          <Link href="/compliance/audit-log?table=invoice" className="underline">
            audit_log
          </Link>
          .
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          Erreur fetch : {error.message}
        </div>
      )}

      {/* Section : à encaisser */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/40 p-4">
        <h2 className="text-base font-bold text-amber-900">
          ⏳ À encaisser ({unpaid.length})
        </h2>
        <p className="mt-1 text-xs text-amber-800">
          Cliquer sur « Marquer payée » trace un event{" "}
          <code>UPDATE invoice</code> dans audit_log avec before/after.
        </p>
        {unpaid.length === 0 ? (
          <p className="mt-3 text-sm italic text-neutral-500">
            Toutes les factures émises sont encaissées.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unpaid.map((i) => (
              <li
                key={i.invoice_id}
                className="rounded-lg border border-amber-200 bg-white p-3"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="font-mono text-xs text-neutral-700">
                    {i.numero ?? "—"}
                  </code>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      STATUS_TONE[i.status ?? ""] ?? "bg-neutral-100"
                    }`}
                  >
                    {i.status}
                  </span>
                  <span className="text-xs text-neutral-600">
                    émise {fmtDate(i.issue_date)}
                  </span>
                  {i.due_date && (
                    <span className="text-xs text-neutral-600">
                      · échéance {fmtDate(i.due_date)}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-sm font-semibold text-neutral-900">
                    {fmtCHF(i.total)}
                  </span>
                  <form action={markInvoicePaid} className="inline-flex">
                    <input type="hidden" name="invoice_id" value={i.invoice_id} />
                    <button
                      type="submit"
                      className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                      title="Marquer comme encaissée (trace audit_log)"
                    >
                      ✓ Marquer payée
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section : historique */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-base font-bold tracking-tight">
          20 dernières factures
        </h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm italic text-neutral-400">Aucune facture.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {recent.map((i) => (
              <li
                key={i.invoice_id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm"
              >
                <code className="font-mono text-xs text-neutral-500">
                  {i.numero ?? "—"}
                </code>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    STATUS_TONE[i.status ?? ""] ?? "bg-neutral-100"
                  }`}
                >
                  {i.status}
                </span>
                <span className="font-mono text-xs text-neutral-600">
                  {fmtDate(i.paid_at ?? i.issue_date)}
                </span>
                <span className="ml-auto font-mono text-sm font-semibold text-neutral-900">
                  {fmtCHF(i.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>V1 — Instrumentation audit_log.</strong> Le bouton « Marquer payée »
        UPDATE le statut invoice + appelle <code>log_audit_event(&apos;UPDATE&apos;, &apos;invoice&apos;, …)</code>
        avec before/after en payload. Permet à patrickbays.local de valider la
        chaîne via <code>/compliance/audit-log?table=invoice</code>. V2 :
        rapprochement automatique via API PostFinance Merchant.
      </footer>
    </main>
  );
}
