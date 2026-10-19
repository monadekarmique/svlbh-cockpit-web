// Moniteur DiGiSha — ST6 seul (Patrick, 19.10.2026 : « je veux créer une fenêtre
// DiGiSha qui est mon moniteur personnel qui me permet de monitorer et fine tuner
// les échanges de nos apprenantes »).
//
// ⚠️ Les seuils de signal ci-dessous sont MESURÉS sur les 400 derniers tours
// (19.10.2026), pas supposés — voir SEUILS. Trois signaux proposés au départ ont
// été écartés parce que la mesure les contredit :
//   · « rafale de tours » : 27 rafales sur 400 tours, jusqu'à 28 tours en 11 min.
//     C'est le régime NORMAL d'une conversation, pas une alerte.
//   · « réponse < 300 car. » : 219 tours sur 400 (55 %), médiane 260. Seuil inutile.
//     Recalibré à 100 car. (p10 mesuré) → 45 tours, 11 %.
//   · « marqueur ⟦à apprendre⟧ dans la réponse » : 0 occurrence sur 400. Les termes
//     sont captés côté serveur dans digisha_a_apprendre, pas par un marqueur visible.
import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Moniteur DiGiSha" };
export const dynamic = "force-dynamic";

const JOURS = 7;
const REPONSE_COURTE = 100; // p10 mesuré le 19.10 sur 400 tours
const MESURE_EN_TETE = /^\s*Mesure\s*:/;

type Tour = {
  id: string;
  svlbh_id: string | null;
  mode: string | null;
  model: string | null;
  source: string | null;
  user_message: string | null;
  assistant_reply: string | null;
  created_at: string;
};
type Cout = { svlbh_id: string | null; model: string | null; cout_usd: number | null };
type Profil = { svlbh_id: string; first_name: string | null; last_name: string | null; stx: string | null };
type Terme = {
  id: string; terme: string; manque: string | null; svlbh_id: string | null;
  fois: number | null; cree_le: string | null; statut: string | null; reponse: string | null;
};
type Consigne = Record<string, unknown>;

// L'horloge est lue HORS du corps du composant : appeler Date.now() pendant le
// rendu est une fonction impure (règle React du projet, vue au lint le 19.10).
async function bornePeriode(jours: number): Promise<string> {
  return new Date(Date.now() - jours * 86400_000).toISOString();
}

const chf = (n: number) => n.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const heure = (iso: string) =>
  new Date(iso).toLocaleString("fr-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default async function MoniteurDigishaPage() {
  await requireSt6();
  const supabase = await createClient();

  const depuis = await bornePeriode(JOURS);

  const [{ data: toursRaw }, { data: coutsRaw }, { data: termesRaw }, { data: consignesRaw }] = await Promise.all([
    supabase
      .from("digisha_chat_log")
      .select("id, svlbh_id, mode, model, source, user_message, assistant_reply, created_at")
      .gte("created_at", depuis)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("digisha_cout_appel").select("svlbh_id, model, cout_usd").gte("appele_le", depuis),
    supabase
      .from("digisha_a_apprendre")
      .select("id, terme, manque, svlbh_id, fois, cree_le, statut, reponse")
      .order("fois", { ascending: false })
      .limit(50),
    supabase.from("digisha_consigne").select("*").limit(50),
  ]);

  const tours = (toursRaw ?? []) as Tour[];
  const couts = (coutsRaw ?? []) as Cout[];
  const termes = (termesRaw ?? []) as Terme[];
  const consignes = (consignesRaw ?? []) as Consigne[];

  const ids = Array.from(new Set(tours.map((t) => t.svlbh_id).filter(Boolean))) as string[];
  const { data: profilsRaw } = ids.length
    ? await supabase.from("praticienne_profile").select("svlbh_id, first_name, last_name, stx").in("svlbh_id", ids)
    : { data: [] as Profil[] };
  const nomDe = new Map<string, Profil>(((profilsRaw ?? []) as Profil[]).map((p) => [p.svlbh_id, p]));

  // ── agrégation par personne ───────────────────────────────────────────────
  type Ligne = {
    sid: string | null; nom: string; stx: string | null;
    tours: Tour[]; cout: number; courtes: number; mesure: number; modeles: Map<string, number>;
  };
  const parPersonne = new Map<string, Ligne>();
  for (const t of tours) {
    const cle = t.svlbh_id ?? "__nul__";
    if (!parPersonne.has(cle)) {
      const p = t.svlbh_id ? nomDe.get(t.svlbh_id) : undefined;
      parPersonne.set(cle, {
        sid: t.svlbh_id,
        nom: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || t.svlbh_id! : t.svlbh_id ? t.svlbh_id : "Non rattaché",
        stx: p?.stx ?? null,
        tours: [], cout: 0, courtes: 0, mesure: 0, modeles: new Map(),
      });
    }
    const l = parPersonne.get(cle)!;
    l.tours.push(t);
    const r = t.assistant_reply ?? "";
    if (r.length < REPONSE_COURTE) l.courtes++;
    if (MESURE_EN_TETE.test(r)) l.mesure++;
    if (t.model) l.modeles.set(t.model, (l.modeles.get(t.model) ?? 0) + 1);
  }
  for (const c of couts) {
    const l = parPersonne.get(c.svlbh_id ?? "__nul__");
    if (l) l.cout += Number(c.cout_usd ?? 0);
  }
  const lignes = Array.from(parPersonne.values()).sort((a, b) => b.tours.length - a.tours.length);

  const totalTours = tours.length;
  const totalCout = couts.reduce((s, c) => s + Number(c.cout_usd ?? 0), 0);
  const nonRattaches = parPersonne.get("__nul__")?.tours.length ?? 0;
  const modesNul = Array.from(new Set((parPersonne.get("__nul__")?.tours ?? []).map((t) => t.mode).filter(Boolean)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Moniteur DiGiSha</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Les échanges des {JOURS} derniers jours, par personne — et les gestes de réglage.
          Mesuré à l&apos;ouverture de la page.
        </p>
      </header>

      {/* ── bandeau ─────────────────────────────────────────────────────── */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Tours", v: String(totalTours) },
          { k: "Personnes", v: String(lignes.filter((l) => l.sid).length) },
          { k: "Coût (USD)", v: chf(totalCout) },
          { k: "Termes à apprendre", v: String(termes.filter((t) => !t.reponse).length) },
        ].map((c) => (
          <div key={c.k} className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{c.k}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{c.v}</div>
          </div>
        ))}
      </section>

      {nonRattaches > 0 && (
        <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <strong>{nonRattaches} tours sur {totalTours} ne portent aucun svlbh_id</strong> — tous en mode{" "}
          <code className="rounded bg-amber-100 px-1">{modesNul.join(", ") || "?"}</code>. Ils ne sont rattachables à
          personne : ni leur coût, ni leurs signaux ne peuvent être lus par apprenante. À corriger côté serveur,
          là où le tour est écrit.
        </p>
      )}

      {/* ── par personne ────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Par personne</h2>
        <div className="space-y-3">
          {lignes.map((l) => (
            <details key={l.sid ?? "nul"} className="rounded-xl ring-1 ring-neutral-200 open:bg-neutral-50">
              <summary className="cursor-pointer list-none p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-medium">
                    {l.nom}
                    {l.stx && <span className="ml-2 text-xs text-neutral-500">{l.stx}</span>}
                  </span>
                  <span className="text-sm tabular-nums text-neutral-600">
                    {l.tours.length} tours · {chf(l.cout)} USD · dernier {heure(l.tours[0].created_at)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {l.courtes > 0 && (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5">
                      {l.courtes} réponse(s) &lt; {REPONSE_COURTE} car.
                    </span>
                  )}
                  {l.mesure > 0 && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-900">
                      {l.mesure} réponse(s) ouvrant par « Mesure : »
                    </span>
                  )}
                  {Array.from(l.modeles.entries()).map(([m, n]) => (
                    <span key={m} className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
                      {m} ×{n}
                    </span>
                  ))}
                </div>
              </summary>

              <div className="space-y-3 border-t border-neutral-200 p-4">
                {l.tours.slice(0, 20).map((t) => {
                  const r = t.assistant_reply ?? "";
                  const court = r.length < REPONSE_COURTE;
                  const mesure = MESURE_EN_TETE.test(r);
                  return (
                    <div key={t.id} className="rounded-lg bg-white p-3 ring-1 ring-neutral-200">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span className="tabular-nums">{heure(t.created_at)}</span>
                        <span>· {t.mode}</span>
                        <span>· {t.model}</span>
                        <span>· {r.length} car.</span>
                        {court && <span className="rounded bg-neutral-200 px-1 text-neutral-700">courte</span>}
                        {mesure && <span className="rounded bg-rose-100 px-1 text-rose-900">« Mesure : »</span>}
                      </div>
                      <p className="text-sm font-medium text-neutral-900">{t.user_message}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{r}</p>
                    </div>
                  );
                })}
                {l.tours.length > 20 && (
                  <p className="text-xs text-neutral-500">
                    … {l.tours.length - 20} tours plus anciens non affichés (20 derniers seulement).
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── termes à apprendre ──────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">
          Termes qu&apos;elle n&apos;a pas su expliquer{" "}
          <span className="text-sm font-normal text-neutral-500">(digisha_a_apprendre)</span>
        </h2>
        {termes.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun terme noté.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-3">Terme</th>
                  <th className="py-2 pr-3">Ce qui manque</th>
                  <th className="py-2 pr-3 text-right">Fois</th>
                  <th className="py-2 pr-3">Noté le</th>
                  <th className="py-2">Réponse donnée</th>
                </tr>
              </thead>
              <tbody>
                {termes.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 align-top">
                    <td className="py-2 pr-3 font-medium">{t.terme}</td>
                    <td className="py-2 pr-3 text-neutral-600">{t.manque ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.fois ?? 1}</td>
                    <td className="py-2 pr-3 tabular-nums text-neutral-500">
                      {t.cree_le ? heure(t.cree_le) : "—"}
                    </td>
                    <td className="py-2">
                      {t.reponse ? (
                        <span className="text-neutral-700">{t.reponse}</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                          en attente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── consignes ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Consignes par personne{" "}
          <span className="text-sm font-normal text-neutral-500">(digisha_consigne)</span>
        </h2>
        {consignes.length === 0 ? (
          <p className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600 ring-1 ring-neutral-200">
            Aucune consigne posée. Les gestes de réglage (écrire une consigne, répondre un terme) s&apos;ajoutent ici
            une fois le réglage rejoué au banc — un seul à la fois, selon la leçon du 19.10.
          </p>
        ) : (
          <pre className="overflow-x-auto rounded-xl bg-neutral-50 p-4 text-xs">
            {JSON.stringify(consignes, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
