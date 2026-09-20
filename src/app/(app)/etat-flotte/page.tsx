import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "État de la flotte" };
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// QUI MODIFIE CETTE PAGE — DEC Patrick 20.09.2026, « n'oublie pas de fixer qui
// modifie cette page ». La réponse a deux étages, et le second est tenu par la
// base, pas par ce commentaire.
//
// ① LES DONNÉES : personne. `public.flotte_releve` n'a AUCUNE policy d'insert,
//    d'update ou de delete — sous RLS, ce qui n'a pas de policy est refusé.
//    Seul `service_role` écrit, donc `bin/ecart-core.py` SEUL. Prouvé le 20.09 :
//    insert/update/delete sous une session authentifiée = permission denied ;
//    lecture ST6 = 1 ligne, autre identité = 0. Un relevé ne se corrige jamais :
//    on en pose un nouveau, horodaté.
// ② LE CODE : Fable seule. Cette page est une VUE DÉRIVÉE ; si plusieurs voix
//    l'éditent, elle redevient ce qu'on cherche à supprimer — un écran qui
//    affirme. Une autre voix qui veut la changer passe par une carte Kanban.
//
// ⛔ CE N'EST PAS UNE SURFACE D'ÉTAT. `kanban_carte` reste la seule (DEC 06.09).
//    Ici, QUE des faits mesurables sur des dépôts : des versions, des présences,
//    des absences. Rien qu'un humain puisse saisir, rien qui ressemble à une
//    tâche, une décision ou une question. Pas de formulaire, pas de bouton.
//
// POURQUOI ELLE EXISTE. Le 20.09, la table « quelles fonctions dans quel socle,
// consommées par quelles apps » a été produite à la main par une voix
// compétente : fausse sur trois points, dont un sur lequel Patrick allait
// décider. Le même jour, six autres « faits » ont eu l'apparence d'une mesure
// sans en être une. Une page générée supprime cette CLASSE d'erreur — à la
// condition, qui est de Patrick (DEC 06.09), qu'elle PORTE SA DATE.
// ─────────────────────────────────────────────────────────────────────────────

const SEUIL_FRAICHEUR_MIN = 12 * 60; // au-delà, la page se déclare vieille

type Pin = {
  app: string; core: string; epingle: string; dernier: string;
  retard: number; outil: boolean; gele: boolean;
};
type Clone = { nom: string; tag: string; date: string };
type Contenu = {
  pins?: Pin[];
  clones?: Clone[];
  tete_core?: string | null;
  plafond?: number;
  hors_convention?: Record<string, { tous: string[]; nouveaux: string[] }>;
};
type Releve = {
  pris_le: string; par: string; hote: string | null;
  age_minutes: number; contenu: Contenu;
};

function ageLisible(min: number): string {
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default async function EtatFlottePage() {
  await requireSt6();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_flotte_dernier")
    .select("pris_le, par, hote, age_minutes, contenu")
    .maybeSingle<Releve>();

  // Une page qui n'a rien mesuré le DIT. Elle n'invente pas un état vide qui
  // ressemblerait à « tout va bien ».
  if (error || !data) {
    return (
      <main className="p-6 max-w-5xl">
        <h1 className="text-2xl font-semibold">État de la flotte</h1>
        <p className="mt-4 rounded-lg bg-amber-50 p-4 text-amber-900">
          Aucun relevé lisible. Cette page n’affiche que ce qu’un instrument a
          mesuré : tant que <code>bin/ecart-core.py --publier</code> n’a pas
          tourné, il n’y a rien à montrer — et surtout rien à déduire.
          {error ? <span className="block mt-2 text-sm opacity-80">({error.message})</span> : null}
        </p>
      </main>
    );
  }

  const c = data.contenu ?? {};
  const pins = (c.pins ?? []).filter((p) => !p.outil);
  const doctrine = pins.filter((p) => !p.gele);
  const enRetard = doctrine.filter((p) => p.retard > 0);
  const gracies = pins.filter((p) => p.gele && p.retard > 0);
  const plafond = c.plafond ?? 3;
  const perimee = data.age_minutes > SEUIL_FRAICHEUR_MIN;

  // Les versions du SOCLE COMMUN Android qui tournent en même temps.
  // ⚠️ ÉGALITÉ EXACTE, jamais `.includes("android")` : il existe DEUX socles
  // Android — `svlbh-core-android` (le commun) et `svlbh-pro-core-android`
  // (la famille Pro). Mesuré le 20.09 : mon premier compteur les mélangeait et
  // annonçait « 3 socles simultanés » là où le commun en avait 2, en comptant
  // le pin pro-core de Chroma 5 comme une troisième version du commun. Un
  // compteur qui agrège deux choses différentes affiche un chiffre vrai pour
  // rien et faux pour la décision qu'il sert.
  const socles = new Map<string, string[]>();
  for (const p of pins) {
    if (p.core !== "svlbh-core-android") continue;
    socles.set(p.epingle, [...(socles.get(p.epingle) ?? []), p.app]);
  }

  return (
    <main className="p-6 max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">État de la flotte</h1>
        {/* La date n'est pas une mention légale : c'est la condition à laquelle
            cette page a le droit d'exister. Elle passe en rouge plutôt que de
            présenter du périmé comme du frais. */}
        <p className={`mt-2 inline-block rounded-md px-3 py-1.5 text-sm ${
            perimee ? "bg-rose-100 text-rose-900" : "bg-neutral-100 text-neutral-700"}`}>
          {perimee ? "⚠️ Mesure ancienne — " : ""}
          Mesuré {ageLisible(data.age_minutes)} par <code>{data.par}</code>
          {data.hote ? ` sur ${data.hote}` : ""} ·{" "}
          {new Date(data.pris_le).toLocaleString("fr-CH")}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Page en lecture seule, générée par la mesure. Rien ne s’y saisit :
          l’état du travail vit dans le Kanban, pas ici.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Pins suivis", v: pins.length, t: "" },
          { l: "En retard (hors grâce)", v: enRetard.length,
            t: enRetard.length ? "text-rose-700" : "text-emerald-700" },
          { l: "En grâce datée", v: gracies.length, t: gracies.length ? "text-amber-700" : "" },
          { l: "Versions du socle commun Android", v: socles.size,
            t: socles.size > 1 ? "text-rose-700" : "text-emerald-700" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-neutral-200 p-4">
            <div className={`text-3xl font-semibold tabular-nums ${k.t}`}>{k.v}</div>
            <div className="mt-1 text-sm text-neutral-600">{k.l}</div>
          </div>
        ))}
      </section>

      {socles.size > 1 && (
        <section className="rounded-xl bg-rose-50 p-4">
          <h2 className="font-medium text-rose-900">
            {socles.size} versions du socle commun Android tournent en même temps
          </h2>
          <p className="mt-1 text-sm text-rose-800">
            Une fonction peut venir du cœur chez l’une et d’une version plus
            ancienne chez l’autre, sans que rien ne le signale à l’écran.
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {[...socles.entries()].sort().map(([v, apps]) => (
              <li key={v}>
                <code className="font-medium">{v}</code> — {apps.join(", ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-medium">Consommation du socle</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-2 pr-4 font-normal">App</th>
                <th className="py-2 pr-4 font-normal">Socle</th>
                <th className="py-2 pr-4 font-normal">Épinglé</th>
                <th className="py-2 pr-4 font-normal">Dernier</th>
                <th className="py-2 font-normal">Retard</th>
              </tr>
            </thead>
            <tbody>
              {pins.sort((a, b) => b.retard - a.retard || a.app.localeCompare(b.app))
                .map((p, i) => (
                <tr key={i} className="border-t border-neutral-100">
                  <td className="py-2 pr-4">{p.app}</td>
                  <td className="py-2 pr-4 text-neutral-500">{p.core}</td>
                  <td className="py-2 pr-4 tabular-nums">{p.epingle}</td>
                  <td className="py-2 pr-4 tabular-nums text-neutral-500">{p.dernier}</td>
                  <td className="py-2">
                    {p.retard === 0 ? (
                      <span className="text-emerald-700">à jour</span>
                    ) : (
                      <span className={p.gele ? "text-amber-700" : p.retard > plafond
                        ? "text-rose-700 font-medium" : "text-neutral-700"}>
                        {p.retard} tag{p.retard > 1 ? "s" : ""}
                        {p.gele ? " · en grâce" : p.retard > plafond ? " · au-delà du plafond" : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Plafond : {plafond} tags. Une grâce est datée et motivée dans
          <code className="mx-1">bin/ecart-core-gel.json</code> — elle s’affiche
          toujours : un gel caché redeviendrait la dette invisible qu’on mesure.
        </p>
      </section>

      {c.hors_convention && Object.keys(c.hors_convention).length > 0 && (
        <section>
          <h2 className="font-medium">Tags hors convention</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(c.hors_convention).map(([depot, d]) => (
              <li key={depot}>
                <code>{depot}</code> — {d.tous.join(", ")}{" "}
                {d.nouveaux.length ? (
                  <span className="text-rose-700 font-medium">
                    ({d.nouveaux.length} nouveau{d.nouveaux.length > 1 ? "x" : ""}, bloquant)
                  </span>
                ) : (
                  <span className="text-neutral-500">(constatés, non bloquants)</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Un tag sans le « v » rend les instruments aveugles : le 20.09, un
            <code className="mx-1">grep v0.11.3</code> a conclu qu’une app
            pointait dans le vide. On ne déplace jamais un tag poussé — les
            suivants portent le « v ».
          </p>
        </section>
      )}

      {(c.clones?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-medium">
            Clones locaux du cœur <span className="font-normal text-neutral-500">
              (tête : {c.tete_core ?? "?"})</span>
          </h2>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {c.clones!.map((cl) => {
              const nu = (t: string) => (t || "").replace(/^v/, "");
              const vieux = cl.tag !== "—" && nu(cl.tag) !== nu(c.tete_core ?? "");
              return (
                <li key={cl.nom} className="flex justify-between gap-2">
                  <span>{cl.nom}</span>
                  <span className={vieux ? "text-amber-700" : "text-neutral-500"}>
                    {cl.tag} · {cl.date}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
