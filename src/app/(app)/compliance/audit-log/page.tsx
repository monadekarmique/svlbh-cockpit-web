import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { requireOwner } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit log · Compliance" };
export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  created_at: string;
  actor_svlbh_id: string | null;
  actor_email: string | null;
  action: string;
  target_table: string | null;
  target_row_id: string | null;
  payload: Record<string, unknown> | null;
  via: string | null;
  ip: string | null;
};

const ACTION_TONE: Record<string, string> = {
  LOGIN: "bg-emerald-100 text-emerald-800",
  LOGOUT: "bg-neutral-100 text-neutral-700",
  SELECT: "bg-sky-100 text-sky-800",
  INSERT: "bg-violet-100 text-violet-800",
  UPDATE: "bg-amber-100 text-amber-900",
  DELETE: "bg-rose-100 text-rose-800",
  EXPORT: "bg-fuchsia-100 text-fuchsia-800",
  GRANT: "bg-blue-100 text-blue-800",
  REVOKE: "bg-orange-100 text-orange-800",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; table?: string }>;
}) {
  await requireOwner();
  const sp = await searchParams;
  const filterAction = sp?.action?.trim() || null;
  const filterTable = sp?.table?.trim() || null;

  const supabase = await createClient();

  // Bearer reader bypass : si Bearer présent, on appelle la RPC SECURITY
  // DEFINER get_audit_log_for_reader (RLS audit_log = ST6 only, donc le
  // client anon ne peut pas SELECT direct). DEC Patrick 2026-05-20.
  const reqHeaders = await headers();
  const bearerToken = reqHeaders.get("x-svlbh-bearer-token");

  let rows: AuditRow[] = [];
  let error: { message: string } | null = null;

  if (bearerToken) {
    const { data, error: rpcError } = await supabase.rpc(
      "get_audit_log_for_reader",
      {
        p_token: bearerToken,
        p_limit: 200,
        p_filter_action: filterAction,
        p_filter_table: filterTable,
      },
    );
    rows = (data ?? []) as AuditRow[];
    error = rpcError as { message: string } | null;
  } else {
    let query = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterAction) query = query.eq("action", filterAction);
    if (filterTable) query = query.eq("target_table", filterTable);

    const { data, error: queryError } = await query;
    rows = (data ?? []) as AuditRow[];
    error = queryError as { message: string } | null;
  }

  // Récupère les valeurs distinctes pour les filtres (sur la fenêtre 200 lignes)
  const distinctActions = Array.from(new Set(rows.map((r) => r.action))).sort();
  const distinctTables = Array.from(
    new Set(rows.map((r) => r.target_table).filter(Boolean) as string[]),
  ).sort();

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Link href="/compliance" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Compliance
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner · Compliance
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          📜 Audit log
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          200 dernières entrées du journal <code>audit_log</code> Supabase
          (RLS Owner ST6 uniquement). Insertion via RPC{" "}
          <code>log_audit_event(action, target_table, target_row_id, payload, via)</code>.
        </p>
      </header>

      {/* Filtres */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-neutral-700">Action</span>
          <select
            name="action"
            defaultValue={filterAction ?? ""}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">— toutes —</option>
            {distinctActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-neutral-700">Table cible</span>
          <select
            name="table"
            defaultValue={filterTable ?? ""}
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          >
            <option value="">— toutes —</option>
            {distinctTables.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Filtrer
        </button>
        {(filterAction || filterTable) && (
          <Link
            href="/compliance/audit-log"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Réinitialiser
          </Link>
        )}
        <span className="ml-auto text-xs text-neutral-500">
          {rows.length} ligne{rows.length > 1 ? "s" : ""}
        </span>
      </form>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <strong>Erreur fetch :</strong> {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Aucune entrée pour ces filtres.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const actionClass = ACTION_TONE[r.action] ?? "bg-neutral-100 text-neutral-700";
            return (
              <li
                key={r.id}
                className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-neutral-500">
                    {fmtDate(r.created_at)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${actionClass}`}
                  >
                    {r.action}
                  </span>
                  {r.target_table && (
                    <span className="text-xs text-neutral-700">
                      <code className="text-violet-700">{r.target_table}</code>
                      {r.target_row_id ? ` · ${r.target_row_id}` : ""}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-neutral-600">
                    {r.actor_email ?? r.actor_svlbh_id ?? "system"}
                    {r.via ? ` · ${r.via}` : ""}
                  </span>
                </div>
                {r.payload && Object.keys(r.payload).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-neutral-500 hover:text-neutral-800">
                      payload ({Object.keys(r.payload).length})
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-[10px] leading-snug text-neutral-700">
{JSON.stringify(r.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>V1 — câblage minimal.</strong> Pour l&apos;instant la RPC{" "}
        <code>log_audit_event</code> est en place mais n&apos;est pas câblée
        automatiquement aux endpoints critiques. Patrick décide quels
        endpoints/triggers la consomment (login, exports, modifications
        sensibles). Indexes en place : created_at DESC, actor_svlbh_id, action,
        (target_table, target_row_id).
      </footer>
    </main>
  );
}
