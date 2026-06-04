import type { Metadata } from "next";
import Link from "next/link";
import { requireSt4Plus } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import { recordInvoicePayment } from "./actions";

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
  praticienne_svlbh_id: string | null;
};

const STATUS_TONE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800",
  SENT: "bg-amber-100 text-amber-900",
  DRAFT: "bg-neutral-100 text-neutral-700",
  OVERDUE: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-neutral-200 text-neutral-600",
};

const PAYMENT_METHODS = [
  { value: "twint", label: "TWINT" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "cash", label: "Espèces" },
  { value: "check", label: "Chèque" },
  { value: "other", label: "Autre" },
];

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

function todayISO(): string {
  // YYYY-MM-DD côté Europe/Zurich pour pré-remplir input[type=date].
  const now = new Date();
  const z = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
  const y = z.getFullYear();
  const m = String(z.getMonth() + 1).padStart(2, "0");
  const d = String(z.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function FacturationPage() {
  const { isOwner, svlbhId, stx } = await requireSt4Plus();

  const sb = await createClient();
  let q = sb
    .from("invoice")
    .select(
      "invoice_id, numero, status, issue_date, due_date, paid_at, total, currency, payment_method, praticienne_svlbh_id",
    )
    .order("issue_date", { ascending: false })
    .limit(50);

  // ST4/ST5 : ne voit QUE ses propres factures.
  // Owner (ST6 / Cercle SR) : voit toutes les factures.
  if (!isOwner && svlbhId) {
    q = q.eq("praticienne_svlbh_id", svlbhId);
  }

  const { data, error } = await q;

  const invoices = (data ?? []) as Invoice[];
  const unpaid = invoices.filter(
    (i) => i.status === "SENT" || i.status === "OVERDUE",
  );
  const recent = invoices.slice(0, 20);

  const today = todayISO();

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
          {isOwner ? `${stx} · Owner — vue globale` : `${stx} · Thérapeute — mes factures`}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          💰 Facturation
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {isOwner ? (
            <>
              Gestion des factures consultantes — émissions, paiements
              PostFinance, exports. Toutes les actions sont tracées dans{" "}
              <Link
                href="/compliance/audit-log?table=invoice"
                className="underline"
              >
                audit_log
              </Link>
              .
            </>
          ) : (
            <>
              Saisis manuellement les paiements reçus (TWINT, virement,
              espèces, chèque) en attendant l&apos;intégration
              PostFinanceCheckout. Chaque enregistrement est tracé dans
              l&apos;audit_log.
            </>
          )}
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
          Déplie une facture pour saisir le paiement reçu (date, moyen,
          montant, note). Trace un event{" "}
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
                className="rounded-lg border border-amber-200 bg-white"
              >
                <details className="group">
                  <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 p-3 hover:bg-amber-50/60">
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
                    <span className="text-xs text-amber-800 group-open:hidden">
                      ▸ Saisir paiement
                    </span>
                    <span className="hidden text-xs text-amber-800 group-open:inline">
                      ▾ Fermer
                    </span>
                  </summary>
                  <form
                    action={recordInvoicePayment}
                    className="grid gap-3 border-t border-amber-100 bg-amber-50/30 p-3 sm:grid-cols-2"
                  >
                    <input
                      type="hidden"
                      name="invoice_id"
                      value={i.invoice_id}
                    />
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-neutral-700">
                        Date du paiement
                      </span>
                      <input
                        type="date"
                        name="paid_at"
                        defaultValue={today}
                        required
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-neutral-700">
                        Moyen de paiement
                      </span>
                      <select
                        name="method"
                        required
                        defaultValue="twint"
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-neutral-700">
                        Montant ({i.currency ?? "CHF"}) —{" "}
                        <span className="font-normal text-neutral-500">
                          défaut = total ({fmtCHF(i.total)})
                        </span>
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        name="amount"
                        placeholder={i.total != null ? String(i.total) : ""}
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs">
                      <span className="font-semibold text-neutral-700">
                        Référence / note (optionnel)
                      </span>
                      <input
                        type="text"
                        name="note"
                        placeholder="n° TWINT, ref. virement, …"
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
                      />
                    </label>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        ✓ Enregistrer le paiement
                      </button>
                    </div>
                  </form>
                </details>
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
                {i.payment_method && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                    {i.payment_method}
                  </span>
                )}
                <span className="ml-auto font-mono text-sm font-semibold text-neutral-900">
                  {fmtCHF(i.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>V1.1 — Saisie manuelle ST4+ avant PostFinanceCheckout.</strong>{" "}
        Chaque saisie UPDATE le statut invoice (PAID + paid_at + method) et
        appelle{" "}
        <code>log_audit_event(&apos;UPDATE&apos;, &apos;invoice&apos;, …)</code>
        {" "}avec before/after, montant et note en payload. V2 : rapprochement
        automatique via API PostFinance Merchant + table{" "}
        <code>invoice_payment</code> pour acomptes/solde.
      </footer>
    </main>
  );
}
