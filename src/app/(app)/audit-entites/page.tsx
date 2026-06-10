"use client";

// Audit Entités Relationnelles Familiales — Big Data 9D×33C
// Module cockpit : croise relation, session_scores, session_lignee_libration,
// session_chakra, lineage_vibrational_signatures depuis Supabase.

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  DIMENSIONS,
  CHAKRA_NAMES,
  RELATION_CATEGORIES,
  fetchAuditData,
  type AuditData,
} from "@/lib/cercle/audit-entites";

function supaClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default function AuditEntitesPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // État de travail LOCAL (pas de persistance DB) : marque NSB / catégories
  // comme « travaillées » pendant la session.
  const [worked, setWorked] = useState<Set<string>>(new Set());
  function toggleWorked(key: string) {
    setWorked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    const load = async () => {
      try {
        const sb = supaClient();
        const result = await fetchAuditData(sb);
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="animate-pulse text-lg" style={{ color: "#8B3A62" }}>
          Chargement audit 9D×33C…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Cockpit
        </Link>
        <p className="text-red-600">Erreur : {error ?? "Données indisponibles"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Cockpit
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#8B3A62" }}>
          🔬 Audit Entités Relationnelles Familiales
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Big data 9D×33C — {data.totalConsultantes} consultantes · {data.totalSessions} sessions · {data.totalDecodages} décodages
        </p>
      </header>

      {/* Section 1 : KPIs globaux */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Relations" initial={data.relations.length} color="#8B3A62" />
        <KpiCard label="Scores sessions" initial={data.scores.length} color="#C28D43" />
        <KpiCard label="Lignées CBS" initial={data.lignees.length} color="#2B5EA7" />
        <KpiCard label="Signatures vibr." initial={data.signatures.length} color="#6B3A8A" />
      </section>

      {/* Section 2 : Relations familiales */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          Graphe Relationnel Familial
        </h2>
        {data.relations.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune relation enregistrée.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.relations.map((r) => (
              <article
                key={r.relation_id}
                className="rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: r.color_hex ?? "#8B3A62" }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-sm font-bold" style={{ color: "#8B3A62" }}>
                    {r.relation_type}
                  </span>
                  <span className="text-[10px] text-neutral-400">{r.relation_state}</span>
                </div>
                <p className="mt-1 text-xs text-neutral-600">But : {r.purpose}</p>
                {r.score_lumiere != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Score :</span>
                    <span
                      className="font-mono text-lg font-bold"
                      style={{ color: r.score_lumiere < 50 ? "#DC2626" : "#16A34A" }}
                    >
                      {r.score_lumiere}%
                    </span>
                  </div>
                )}
                {r.niveau_shamanique_bloques != null && (() => {
                  const k = `nsb:${r.relation_id}`;
                  const done = worked.has(k);
                  return (
                    <button
                      type="button"
                      onClick={() => toggleWorked(k)}
                      className="mt-1 block text-left text-[11px] text-neutral-500 hover:text-neutral-900"
                      style={done ? { textDecoration: "line-through", opacity: 0.5 } : undefined}
                      title="Cliquer pour marquer comme travaillé"
                    >
                      Niveaux shamaniques bloqués : <strong>{r.niveau_shamanique_bloques}</strong>{done ? " ✓" : ""}
                    </button>
                  );
                })()}
                {r.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.categories.map((c) => {
                      const k = `cat:${r.relation_id}:${c}`;
                      const done = worked.has(k);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleWorked(k)}
                          className={
                            "rounded-full px-2 py-0.5 text-[9px] font-medium transition " +
                            (done
                              ? "bg-green-100 text-green-700 line-through"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100")
                          }
                          title="Cliquer pour marquer comme travaillé"
                        >
                          {c}{done ? " ✓" : ""}
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 : Heatmap 9D × 33C */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          Heatmap 9D × 33C — Chakras nettoyés
        </h2>
        <p className="text-xs text-neutral-600">
          Chakras passés en session. Vert = nettoyé. Gris = non traité.
        </p>
        <div className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
          {DIMENSIONS.filter((d) => d.chakras.length > 0).map((dim) => (
            <div key={dim.id} className="mb-3">
              <button
                type="button"
                onClick={() => dim.chakras.forEach((ck) => toggleWorked(`chakra:${dim.id}:${ck}`))}
                className="mb-1 block text-left text-[10px] font-bold text-neutral-500 hover:text-blue-700"
                title="Cliquer la dimension : basculer tous ses chakras (travaillé)"
              >
                {dim.name}
              </button>
              <div className="flex flex-wrap gap-1.5">
                {dim.chakras.map((ck) => {
                  const k = `chakra:${dim.id}:${ck}`;
                  const cleanedDb = data.chakras.some(
                    (sc) => sc.chakra_key === String(ck) && sc.cleaned,
                  );
                  const cleaned = cleanedDb || worked.has(k);
                  return (
                    <button
                      key={ck}
                      type="button"
                      onClick={() => toggleWorked(k)}
                      className="flex h-9 min-w-[70px] items-center justify-center rounded-lg border text-[10px] font-mono font-bold transition"
                      style={{
                        backgroundColor: cleaned ? "#DCFCE7" : "#F5F5F5",
                        borderColor: cleaned ? "#16A34A" : "#E5E5E5",
                        color: cleaned ? "#166534" : "#A3A3A3",
                      }}
                      title={`C${ck} — ${CHAKRA_NAMES[ck] ?? ""} (cliquer = travaillé)`}
                    >
                      C{ck}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 : Scores de Lumière SLSA tabelle S1–S5 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          SLSA Tabelle — S1 à S5
        </h2>
        {data.scores.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun score enregistré.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-neutral-50 text-left text-neutral-500">
                  <th className="px-3 py-2">Session</th>
                  <th className="px-3 py-2">SLA</th>
                  <th className="px-3 py-2">SLSA</th>
                  <th className="px-3 py-2">S1</th>
                  <th className="px-3 py-2">S2</th>
                  <th className="px-3 py-2">S3</th>
                  <th className="px-3 py-2">S4</th>
                  <th className="px-3 py-2">S5</th>
                  <th className="px-3 py-2">SLM</th>
                </tr>
              </thead>
              <tbody>
                {data.scores.map((s) => {
                  const k = `session:${s.session_id}`;
                  const open = worked.has(k);
                  return (
                  <tr key={s.session_id} className={"border-b last:border-0 " + (open ? "bg-amber-50" : "hover:bg-neutral-50")}>
                    <td className="px-3 py-2 font-mono">
                      <button
                        type="button"
                        onClick={() => toggleWorked(k)}
                        className="text-blue-700 hover:underline"
                        title="Cliquer : id complet de la session + marquer SLA vérifié"
                      >
                        {open ? s.session_id : s.session_id.slice(0, 8)}{open ? " · ✓ vérifié" : ""}
                      </button>
                    </td>
                    <ScoreCell value={s.sla} seuil={78} />
                    <ScoreCell value={s.slsa} seuil={32} />
                    <ScoreCell value={s.slsa_s1} />
                    <ScoreCell value={s.slsa_s2} />
                    <ScoreCell value={s.slsa_s3} />
                    <ScoreCell value={s.slsa_s4} />
                    <ScoreCell value={s.slsa_s5} />
                    <ScoreCell value={s.slm} seuil={100} />
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 5 : Lignées CBS transgénérationnel */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          Lignées CBS — Analyse Transgénérationnelle
        </h2>
        {data.lignees.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune lignée enregistrée.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.lignees.map((l) => (
              <article
                key={l.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: "#2B5EA7" }}
              >
                <p className="font-mono text-sm font-bold text-blue-900">
                  {l.lignee ?? "Lignée inconnue"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500">CBS hérité : </span>
                    <strong>{l.cbs_herite_value ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">CBS session : </span>
                    <strong>{l.cbs_session_value ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Générations : </span>
                    <strong>{l.generations_count ?? "—"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Stress LT : </span>
                    <strong>{l.stress_lignes_temps ?? "—"}</strong>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  {l.q1_libere && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                      Q1 libéré ✓
                    </span>
                  )}
                  {l.q2_valeur_sans && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      Q2: {l.q2_valeur_sans}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Section 6 : Signatures vibratoires */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          Signatures Vibratoires Chromatiques
        </h2>
        {data.signatures.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune signature enregistrée.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.signatures.map((sig) => (
              <article
                key={sig.signature_id}
                className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderLeftWidth: 4, borderLeftColor: sig.chromatic_key_color ?? "#6B3A8A" }}
              >
                {sig.chromatic_key_color && (
                  <div
                    className="h-10 w-10 shrink-0 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: sig.chromatic_key_color }}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-bold text-neutral-800">
                    {sig.pattern ?? "Pattern non défini"}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Méridien : {sig.chromatic_key_meridian ?? "—"} · {new Date(sig.decoded_at).toLocaleDateString("fr-CH")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Composants utilitaires ──

function KpiCard({ label, initial, color }: { label: string; initial: number; color: string }) {
  // Saisissable localement (override de travail, pas de persistance DB).
  const [val, setVal] = useState<string>(String(initial));
  return (
    <article
      className="rounded-xl border bg-white p-4 shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <p className="text-[11px] text-neutral-500">{label}</p>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full bg-transparent font-mono text-2xl font-extrabold outline-none"
        style={{ color }}
        aria-label={`Saisir ${label}`}
      />
    </article>
  );
}

function ScoreCell({ value, seuil }: { value: number | null; seuil?: number }) {
  if (value == null) {
    return <td className="px-3 py-2 text-neutral-300">—</td>;
  }
  const critical = seuil != null && value < seuil;
  return (
    <td
      className="px-3 py-2 font-mono font-bold"
      style={{ color: critical ? "#DC2626" : "#166534" }}
    >
      {value}%
    </td>
  );
}
