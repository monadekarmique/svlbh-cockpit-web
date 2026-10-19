import type { Metadata } from "next";
import Link from "next/link";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Coûts de l'API" };
export const dynamic = "force-dynamic";

// Coûts des appels au modèle (DEC Patrick 19.10.2026 : « oui et c'est une page de cockpit admin »).
// Pourquoi : le 19.10 vers 08h, le plafond de dépenses du compte Anthropic est tombé sans que rien ne le montre — DiGiSha et
// les scripts du Mac refusés jusqu'au 01.11 ; aucun écran ne lisait digisha_cout_appel. Patrick a relevé le plafond à 200 $.
// Gate = la RLS de digisha_cout_appel pour tout voir (is_owner_st6) : ST6 strict, pas ST5 (ce sont ses finances).
// Limite connue : le journal ne voit que les appels qui s'y inscrivent (serveur DiGiSha, web pro, scripts du Mac).
const PLAFOND_MOIS_USD = 200; // fixé dans la console Anthropic par Patrick le 19.10.2026 (« nouveau plafond $200 »)
const ALERTE = 0.8;

type Ligne = { appele_le: string; source: string | null; mode: string | null; model: string | null; cout_usd: number | string | null };

const zurich = (iso: string) =>
  new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(iso)).split(".").reverse().join("-");

function poste(source: string | null): string {
  const s = source ?? "";
  if (s.startsWith("render")) return "DiGiSha (serveur)";
  if (s.startsWith("mac")) return "Scripts du Mac";
  if (s.includes("pro")) return "Web pro";
  return s || "inconnu";
}

const usd = (n: number) => n.toLocaleString("fr-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";

function grouper<K extends string>(lignes: Ligne[], cle: (l: Ligne) => K) {
  const m = new Map<K, { n: number; usd: number }>();
  for (const l of lignes) {
    const k = cle(l);
    const v = m.get(k) ?? { n: 0, usd: 0 };
    v.n += 1;
    v.usd += Number(l.cout_usd ?? 0);
    m.set(k, v);
  }
  return [...m.entries()];
}

export default async function CoutsPage() {
  await requireSt6();
  const sb = await createClient();
  const maintenant = new Date();
  const moisZurich = zurich(maintenant.toISOString()).slice(0, 7);
  const debut = new Date(`${moisZurich}-01T00:00:00+02:00`);
  debut.setDate(debut.getDate() - 1); // marge de fuseau ; le filtre exact se fait ci-dessous en heure de Zurich
  const { data, error } = await sb
    .from("digisha_cout_appel")
    .select("appele_le, source, mode, model, cout_usd")
    .gte("appele_le", debut.toISOString())
    .order("appele_le", { ascending: false })
    .limit(20000);
  const lignes = ((data ?? []) as Ligne[]).filter((l) => zurich(l.appele_le).startsWith(moisZurich));
  const total = lignes.reduce((s, l) => s + Number(l.cout_usd ?? 0), 0);
  const part = total / PLAFOND_MOIS_USD;
  const aujourdhui = zurich(maintenant.toISOString());
  const duJour = lignes.filter((l) => zurich(l.appele_le) === aujourdhui).reduce((s, l) => s + Number(l.cout_usd ?? 0), 0);
  const joursEcoules = Number(aujourdhui.slice(8, 10));
  const rythme = joursEcoules > 0 ? total / joursEcoules : 0;
  const parJour = grouper(lignes, (l) => zurich(l.appele_le)).sort((a, b) => b[0].localeCompare(a[0]));
  const postes = [...new Set(lignes.map((l) => poste(l.source)))].sort();
  const parJourPoste = new Map<string, Map<string, number>>();
  for (const l of lignes) {
    const j = zurich(l.appele_le);
    const m = parJourPoste.get(j) ?? new Map<string, number>();
    m.set(poste(l.source), (m.get(poste(l.source)) ?? 0) + Number(l.cout_usd ?? 0));
    parJourPoste.set(j, m);
  }
  const parPoste = grouper(lignes, (l) => poste(l.source)).sort((a, b) => b[1].usd - a[1].usd);
  const parModele = grouper(lignes, (l) => l.model ?? "inconnu").sort((a, b) => b[1].usd - a[1].usd);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <header>
        <Link href="/admin" className="text-xs text-neutral-500 underline">← Admin</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Coûts de l&apos;API — {moisZurich}</h1>
        <p className="mt-1 text-xs text-neutral-500">
          Lu à l&apos;instant dans digisha_cout_appel. Ne voit que les appels journalisés (serveur DiGiSha, web pro, scripts du Mac).
        </p>
      </header>

      {error ? (
        <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-900 ring-1 ring-rose-200">Lecture impossible : {error.message}</p>
      ) : null}

      <section className={`rounded-xl p-5 ring-1 ${part >= ALERTE ? "bg-rose-50 ring-rose-300" : "bg-white ring-neutral-200"}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-3xl font-bold">{usd(total)}</p>
          <p className="text-sm text-neutral-600">sur un plafond de {usd(PLAFOND_MOIS_USD)} · {Math.round(part * 100)} %</p>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-neutral-100">
          <div className={`h-3 rounded-full ${part >= ALERTE ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${Math.min(part, 1) * 100}%` }} />
        </div>
        <p className="mt-3 text-sm text-neutral-700">
          Aujourd&apos;hui : <b>{usd(duJour)}</b> · moyenne du mois : <b>{usd(rythme)}</b> par jour
          {rythme > 0 ? (
            <> · à ce rythme, {usd(rythme * new Date(Number(moisZurich.slice(0, 4)), Number(moisZurich.slice(5, 7)), 0).getDate())} sur le mois</>
          ) : null}
        </p>
        {part >= ALERTE ? (
          <p className="mt-2 text-sm font-semibold text-rose-800">
            ⚠️ Plus de {Math.round(ALERTE * 100)} % du plafond : au-delà, DiGiSha s&apos;arrête jusqu&apos;au mois suivant.
            Le plafond se relève dans la console Anthropic.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-700">Par jour</h2>
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-neutral-200">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-neutral-500">
              <th className="px-3 py-2">Jour</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">Appels</th>
              {postes.map((p) => <th key={p} className="px-3 py-2 text-right">{p}</th>)}
            </tr></thead>
            <tbody>
              {parJour.map(([j, v]) => (
                <tr key={j} className="border-b last:border-0">
                  <td className="px-3 py-1.5">{j}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{usd(v.usd)}</td>
                  <td className="px-3 py-1.5 text-right">{v.n}</td>
                  {postes.map((p) => <td key={p} className="px-3 py-1.5 text-right text-neutral-600">{usd(parJourPoste.get(j)?.get(p) ?? 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {[{ titre: "Par poste", rangs: parPoste }, { titre: "Par modèle", rangs: parModele }].map(({ titre, rangs }) => (
          <section key={titre}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-700">{titre}</h2>
            <div className="rounded-xl bg-white ring-1 ring-neutral-200">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-neutral-500">
                  <th className="px-3 py-2"></th><th className="px-3 py-2 text-right">Appels</th>
                  <th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-right">Par appel</th>
                </tr></thead>
                <tbody>
                  {rangs.map(([k, v]) => (
                    <tr key={k} className="border-b last:border-0">
                      <td className="px-3 py-1.5">{k}</td><td className="px-3 py-1.5 text-right">{v.n}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{usd(v.usd)}</td>
                      <td className="px-3 py-1.5 text-right text-neutral-600">{usd(v.n ? v.usd / v.n : 0).replace(" $", "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
