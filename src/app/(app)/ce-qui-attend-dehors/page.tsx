import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ce qui attend dehors" };
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI ATTEND DEHORS — Patrick, 05.11.2026, devant /etat-flotte : « si je regarde la
// big picture est ce que cette page me cache qqch que je ne vois pas ? Y a-t-il une autre
// vue à inclure et à tracker ? » ; puis « 1 est une nouvelle page » (carte 3163460b).
//
// Ce qui dépend des AUTRES : l'argent promis qui n'est pas arrivé, les factures sans
// paiement, les apps envoyées qu'elles n'ont jamais ouvertes. Lu dans le même relevé que
// /etat-flotte (`bin/releve-vie.py`, partie `dehors`), avec sa date. Rien ne s'y saisit :
// une relance, une décision ou une tâche vit dans le Kanban.
//
// Le cash fait foi (DEC Patrick 09.09.2026) : un paiement que tu as déclaré n'est affiché
// « en attente » que s'il est plus récent que le dernier relevé bancaire importé.
// ─────────────────────────────────────────────────────────────────────────────

const SEUIL_FRAICHEUR_MIN = 90;

type Illisible = { illisible: string };
type Declare = { prenom: string; montant: number; le: string; moyen?: string; source?: string };
type Lien = { prenom: string; montant: number; reference: string; cree_le: string; ouverture_le: string | null };
type Facture = { numero: string; statut: string; total: number; issue_date: string; due_date: string | null; qui: string };
type App = { prenom: string; app: string; etat: string; fiche: boolean };
type Releve = { compte: string; jusqu_au: string };
type Dehors = {
  releves?: Releve[] | Illisible; declares?: Declare[] | Illisible; declares_avant_releve?: number;
  liens?: Lien[] | Illisible; factures?: Facture[] | Illisible; apps?: App[] | Illisible;
};
type Ligne = { pris_le: string; par: string; hote: string | null; age_minutes: number; contenu: { dehors?: Dehors } };

function lisible<T>(v: T | Illisible | undefined): v is T {
  return v !== undefined && !(typeof v === "object" && v !== null && "illisible" in (v as object));
}

const date = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";
const chf = (x: number) => `CHF ${x.toFixed(2)}`;
const jours = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

function Illis({ titre, v }: { titre: string; v: unknown }) {
  const motif = typeof v === "object" && v !== null && "illisible" in (v as object) ? (v as Illisible).illisible : "absent du relevé";
  return (
    <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      {titre} : illisible — rien à en déduire. <span className="opacity-70">({motif})</span>
    </p>
  );
}

export default async function CeQuiAttendDehorsPage() {
  await requireSt6();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_flotte_vie_dernier")
    .select("pris_le, par, hote, age_minutes, contenu")
    .maybeSingle<Ligne>();

  if (error || !data?.contenu?.dehors) {
    return (
      <main className="p-6 max-w-5xl">
        <h1 className="text-2xl font-semibold">Ce qui attend dehors</h1>
        <p className="mt-4 rounded-lg bg-amber-50 p-4 text-amber-900">
          Aucun relevé lisible : tant que <code>bin/releve-vie.py --publier</code> n’a pas tourné, rien à déduire.
          {error ? <span className="mt-2 block text-sm opacity-80">({error.message})</span> : null}
        </p>
      </main>
    );
  }

  const d = data.contenu.dehors;
  const perimee = data.age_minutes > SEUIL_FRAICHEUR_MIN;
  const parPersonne = new Map<string, App[]>();
  if (lisible<App[]>(d.apps)) for (const a of d.apps) parPersonne.set(a.prenom, [...(parPersonne.get(a.prenom) ?? []), a]);

  return (
    <main className="p-6 max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Ce qui attend dehors</h1>
        <p className={`mt-2 inline-block rounded-md px-3 py-1.5 text-sm ${
            perimee ? "bg-rose-100 text-rose-900" : "bg-neutral-100 text-neutral-700"}`}>
          {perimee ? "⚠️ Relevé ancien — " : ""}
          Mesuré il y a {data.age_minutes} min par <code>{data.par}</code>
          {data.hote ? ` sur ${data.hote}` : ""} · {new Date(data.pris_le).toLocaleString("fr-CH", { timeZone: "Europe/Zurich" })}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Ce qui dépend des autres. Page en lecture seule : une relance se décide dans le Kanban.
        </p>
      </header>

      <section>
        <h2 className="font-medium">L’argent promis pas encore arrivé</h2>
        {lisible<Releve[]>(d.releves) && (
          <p className="mt-1 text-xs text-neutral-500">
            Relevés bancaires importés : {d.releves.slice(0, 4).map((r) => `${r.compte} jusqu’au ${date(r.jusqu_au)}`).join(" · ")}.
          </p>
        )}

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Paiements que tu as déclarés, pas encore sur un relevé</h3>
        {lisible<Declare[]>(d.declares) ? (
          d.declares.length === 0 ? <p className="mt-1 text-sm text-emerald-800">Aucun.</p> : (
            <ul className="mt-1 space-y-1 text-sm">
              {d.declares.map((x, i) => (
                <li key={i}>
                  <span className="font-medium">{x.prenom}</span> · {chf(x.montant)} · le {date(x.le)}
                  <span className="text-neutral-500"> · {x.moyen}</span>
                </li>
              ))}
            </ul>
          )
        ) : <Illis titre="Paiements déclarés" v={d.declares} />}
        {(d.declares_avant_releve ?? 0) > 0 && (
          <p className="mt-1 text-xs text-neutral-500">
            {d.declares_avant_releve} déclaration{(d.declares_avant_releve ?? 0) > 1 ? "s" : ""} plus ancienne
            {(d.declares_avant_releve ?? 0) > 1 ? "s" : ""} que le dernier relevé : rapprochée{(d.declares_avant_releve ?? 0) > 1 ? "s" : ""} ou non, le fichier ne le dit pas — pas affichée{(d.declares_avant_releve ?? 0) > 1 ? "s" : ""} comme manquante{(d.declares_avant_releve ?? 0) > 1 ? "s" : ""}.
          </p>
        )}

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Liens de paiement personnels envoyés, jamais payés</h3>
        {lisible<Lien[]>(d.liens) ? (
          d.liens.length === 0 ? <p className="mt-1 text-sm text-emerald-800">Aucun.</p> : (
            <ul className="mt-1 space-y-1 text-sm">
              {d.liens.map((l) => (
                <li key={l.reference} className={jours(l.cree_le) > 14 ? "text-rose-800" : ""}>
                  <span className="font-medium">{l.prenom}</span> · {chf(l.montant)} · créé le {date(l.cree_le)}
                  ({jours(l.cree_le)} j){l.ouverture_le ? ` · ouvert le ${date(l.ouverture_le)}` : " · jamais ouvert"}
                  <span className="text-neutral-500"> · {l.reference}</span>
                </li>
              ))}
            </ul>
          )
        ) : <Illis titre="Liens" v={d.liens} />}

        <h3 className="mt-4 text-sm font-medium text-neutral-700">Factures envoyées sans paiement relié</h3>
        {lisible<Facture[]>(d.factures) ? (
          d.factures.length === 0 ? <p className="mt-1 text-sm text-emerald-800">Aucune.</p> : (
            <ul className="mt-1 space-y-1 text-sm">
              {d.factures.map((f) => (
                <li key={f.numero} className={f.due_date && jours(f.due_date) > 0 ? "text-rose-800" : ""}>
                  <span className="font-medium">{f.qui}</span> · {f.numero} · {chf(f.total)} · émise le {date(f.issue_date)}
                  {f.due_date ? ` · échue le ${date(f.due_date)}` : ""}
                </li>
              ))}
            </ul>
          )
        ) : <Illis titre="Factures" v={d.factures} />}
      </section>

      <section>
        <h2 className="font-medium">Les apps envoyées, jamais ouvertes</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Testeuses TestFlight invitées ou ayant accepté, sans installation — lu sur App Store Connect. Android (Play) n’y est pas.
        </p>
        {lisible<App[]>(d.apps) ? (
          parPersonne.size === 0 ? <p className="mt-1 text-sm text-emerald-800">Aucune.</p> : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...parPersonne.entries()].map(([qui, apps]) => (
                <li key={qui}>
                  <span className={`font-medium ${apps[0].fiche ? "" : "text-neutral-500"}`}>{qui}</span>
                  <span className="text-neutral-600"> — {apps.map((a) => a.app + (a.etat.startsWith("acceptée") ? " (acceptée)" : "")).join(", ")}</span>
                </li>
              ))}
            </ul>
          )
        ) : <Illis titre="Apps" v={d.apps} />}
      </section>
    </main>
  );
}
