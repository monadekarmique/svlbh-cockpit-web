"use client";

// Demandes V5 — fetch live invoices via vlbh-energy-mcp.
// Token vlbh_token + patient_id à saisir côté client (localStorage).

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchInvoices,
  STATUS_LABEL,
  STATUS_COLOR,
  type Invoice,
} from "@/lib/cercle/demandes";
import { SiZhuValidationSection } from "@/components/sizhu-validation-section";

const KEY_TOKEN = "vlbh_token";
const KEY_PATIENT = "vlbh_demandes_patient_id";

export default function DemandesPage() {
  const [token, setToken] = useState("");
  const [patientId, setPatientId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem(KEY_TOKEN) ?? "");
    setPatientId(localStorage.getItem(KEY_PATIENT) ?? "");
  }, []);

  const persist = (k: string, v: string) => {
    localStorage.setItem(k, v);
  };

  const onFetch = async () => {
    setError(null);
    setLoading(true);
    setInvoices(null);
    persist(KEY_TOKEN, token);
    persist(KEY_PATIENT, patientId);
    const res = await fetchInvoices(patientId.trim(), token.trim());
    setLoading(false);
    if (res.ok) {
      setInvoices(res.invoices);
    } else {
      setError(res.error);
    }
  };

  const total = invoices?.reduce((s, inv) => s + inv.amount, 0) ?? 0;
  const currency = invoices?.[0]?.currency ?? "CHF";

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
          Concept de validation Si Zhu + dates de libération efficaces, puis
          factures live via API vlbh-energy-mcp.
        </p>
      </header>

      {/* Concept doctrinal Si Zhu — points de validation radiesthésique */}
      <SiZhuValidationSection />

      <header className="pt-2">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          💳 Factures iTherapeut
        </h2>
        <p className="mt-0.5 text-xs text-neutral-600">
          Token + patient_id persistés en localStorage.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-700">
            Token vlbh
          </span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token vlbh-energy-mcp"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-700">
            Patient ID
          </span>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="UUID ou code patient"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs"
          />
        </label>
        <button
          type="button"
          onClick={onFetch}
          disabled={loading || !token || !patientId}
          className="w-full rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "… chargement" : "🔄 Charger les factures"}
        </button>
        {error ? (
          <p className="text-center text-xs font-semibold text-rose-600">
            ✕ {error}
          </p>
        ) : null}
      </section>

      {invoices !== null ? (
        invoices.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
            Aucune facture trouvée pour ce patient.
          </div>
        ) : (
          <>
            <section className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 text-center">
              <p className="text-xs font-bold uppercase text-neutral-700">
                Total · {invoices.length} facture
                {invoices.length > 1 ? "s" : ""}
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-blue-900 tabular-nums">
                {total.toFixed(2)} {currency}
              </p>
            </section>

            <ul className="space-y-2">
              {invoices.map((inv) => {
                const statusColor = STATUS_COLOR[inv.status] ?? "#999";
                return (
                  <li
                    key={inv.id}
                    className="rounded-xl border bg-white p-4 shadow-sm"
                    style={{ borderLeftColor: statusColor, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-mono text-sm font-bold text-blue-900">
                        {inv.invoice_number}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{ backgroundColor: statusColor }}
                      >
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-base font-bold text-neutral-900 tabular-nums">
                      {inv.amount.toFixed(2)} {inv.currency}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Émise le {inv.issue_date}
                      {inv.due_date ? ` · Échéance ${inv.due_date}` : ""}
                      {inv.paid_date ? ` · Payée le ${inv.paid_date}` : ""}
                    </p>
                    {inv.description ? (
                      <p className="mt-1 text-xs text-neutral-700">
                        {inv.description}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )
      ) : null}
    </div>
  );
}
