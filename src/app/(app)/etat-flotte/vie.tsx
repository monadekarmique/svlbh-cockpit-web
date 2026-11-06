import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI TOURNE VRAIMENT — Patrick, 05.11.2026, devant cette page : « si je regarde
// la big picture est ce que cette page me cache qqch que je ne vois pas ? » ; puis
// « tu commences par 2 et 3 sur cette page et 1 est une nouvelle page » (carte 3163460b).
//
// Section 2 : ce qui est EN SERVICE (Render, fonctions Supabase, agents du Mac,
// migrations, branches). Section 3 : ponts, voix, Kanban, dépôts non poussés.
//
// LES DONNÉES : personne ne les saisit. `public.flotte_vie_releve` n'a aucune policy
// d'écriture ; seul `bin/releve-vie.py --publier` (LaunchAgent du MacBook Pro, toutes
// les 30 min) y pose un relevé. Cette section ne calcule aucun verdict : elle montre
// celui de l'instrument, avec sa date. Une partie qu'il n'a pas pu lire est dite
// « illisible » — jamais affichée comme vide.
// ─────────────────────────────────────────────────────────────────────────────

const SEUIL_FRAICHEUR_MIN = 90;

type Service = { nom: string; depot: string; branche: string; verdict: string; commit?: string; tete?: string;
  retard_commits?: number; en_service_le?: string; objet?: string; echec?: { statut: string; le: string; commit: string } };
type Fonction = { slug: string; version?: number; deploye_le: string; verdict: string; source?: string; main_le?: string };
type Agent = { label: string; verdict: string; dernier_code?: number | string; dernier_passage?: string };
type Pose = { fichier: string; carte?: string; quoi?: string; approuvee: boolean; sonde: string };
type Branche = { depot: string; branche: string; le: string; objet: string; commits: number | null };
type NonPousse = { clone: string; commits_non_pousses: number; fichiers_non_commites: number; tete_locale: string; tete_age_h: number };
type Voix = { voix: string; cours: number; afaire: number; humain: number };
type Illisible = { illisible: string };
type Contenu = {
  services?: Service[] | Illisible; fonctions?: Fonction[] | Illisible; agents?: Agent[] | Illisible;
  poses?: Pose[] | Illisible; branches?: Branche[] | Illisible; non_pousses?: NonPousse[] | Illisible;
  kanban?: { colonnes: Record<string, number>; voix: Voix[] } | Illisible;
  ponts?: Record<string, string> | Illisible; duree_s?: number;
};
type Releve = { pris_le: string; par: string; hote: string | null; age_minutes: number; contenu: Contenu };

function ageLisible(min: number): string {
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

const jour = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("fr-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit" }) : "—";

function lisible<T>(v: T | Illisible | undefined): v is T {
  return v !== undefined && !(typeof v === "object" && v !== null && "illisible" in (v as object));
}

function Illis({ titre, v }: { titre: string; v: unknown }) {
  const motif = typeof v === "object" && v !== null && "illisible" in (v as object) ? (v as Illisible).illisible : "absent du relevé";
  return (
    <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      {titre} : illisible — rien à en déduire. <span className="opacity-70">({motif})</span>
    </p>
  );
}

const ROUGE = "text-rose-800 font-medium";
const OK = ["à jour", "tourne", "en attente de son heure"];

export default async function VieSection() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_flotte_vie_dernier")
    .select("pris_le, par, hote, age_minutes, contenu")
    .maybeSingle<Releve>();

  if (error || !data) {
    return (
      <section>
        <h2 className="font-medium">Ce qui tourne vraiment</h2>
        <p className="mt-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Aucun relevé lisible : tant que <code>bin/releve-vie.py --publier</code> n’a pas tourné, rien à déduire.
          {error ? <span className="mt-1 block opacity-80">({error.message})</span> : null}
        </p>
      </section>
    );
  }

  const c = data.contenu ?? {};
  const perimee = data.age_minutes > SEUIL_FRAICHEUR_MIN;

  return (
    <>
      <section>
        <h2 className="font-medium">Ce qui tourne vraiment</h2>
        <p className={`mt-2 inline-block rounded-md px-3 py-1.5 text-sm ${
            perimee ? "bg-rose-100 text-rose-900" : "bg-neutral-100 text-neutral-700"}`}>
          {perimee ? "⚠️ Relevé ancien, l’instrument n’a pas tourné — " : ""}
          Mesuré {ageLisible(data.age_minutes)} par <code>{data.par}</code>
          {data.hote ? ` sur ${data.hote}` : ""} · {jour(data.pris_le)}
          {c.duree_s ? ` · ${c.duree_s} s` : ""}
        </p>

        {/* Services Render : le commit en service contre la tête de sa branche */}
        <h3 className="mt-5 text-sm font-medium text-neutral-700">Services en ligne (Render)</h3>
        {lisible<Service[]>(c.services) ? (() => {
          const ecarts = c.services.filter((s) => s.verdict !== "à jour");
          const aJour = c.services.filter((s) => s.verdict === "à jour");
          return (
            <>
              <ul className="mt-1 space-y-1 text-sm">
                {ecarts.map((s) => (
                  <li key={s.nom} className={s.verdict === "sans clone local" ? "text-neutral-600" : ROUGE}>
                    {s.nom} — {s.verdict}
                    {s.retard_commits ? ` : ${s.retard_commits} commit${s.retard_commits > 1 ? "s" : ""} de ${s.branche} pas en service` : ""}
                    {s.echec ? ` (${s.echec.statut}, ${jour(s.echec.le)}, ${s.echec.commit})` : ""}
                    {s.commit ? <span className="font-normal text-neutral-500"> · en service {s.commit} depuis {jour(s.en_service_le)}</span> : null}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-sm text-emerald-800">{aJour.length} service{aJour.length > 1 ? "s" : ""} à jour de leur branche.</p>
            </>
          );
        })() : <Illis titre="Services" v={c.services} />}

        {/* Fonctions Supabase : dernier déploiement contre la dernière modification sur main */}
        <h3 className="mt-5 text-sm font-medium text-neutral-700">Fonctions Supabase</h3>
        {lisible<Fonction[]>(c.fonctions) ? (() => {
          const main = c.fonctions.filter((f) => f.verdict === "main plus récent que le service");
          const sans = c.fonctions.filter((f) => f.verdict.startsWith("source absente"));
          const aJour = c.fonctions.filter((f) => f.verdict === "à jour");
          return (
            <>
              <ul className="mt-1 space-y-1 text-sm">
                {main.map((f) => (
                  <li key={f.slug} className={ROUGE}>
                    {f.slug} — main modifié le {jour(f.main_le)}, en service depuis le {jour(f.deploye_le)} (v{f.version})
                  </li>
                ))}
              </ul>
              {sans.length > 0 && (
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer text-amber-800">
                    {sans.length} fonctions en service dont la source n’est dans aucun clone du Mac
                  </summary>
                  <p className="mt-1 text-xs text-neutral-500">
                    Déployées sans dépôt local : rien ne dit d’où vient le code qui tourne.
                  </p>
                  <ul className="mt-1 grid gap-0.5 sm:grid-cols-2">
                    {sans.map((f) => <li key={f.slug}>{f.slug} <span className="text-neutral-500">· {jour(f.deploye_le)}</span></li>)}
                  </ul>
                </details>
              )}
              <p className="mt-1 text-sm text-emerald-800">{aJour.length} fonction{aJour.length > 1 ? "s" : ""} à jour de main.</p>
            </>
          );
        })() : <Illis titre="Fonctions" v={c.fonctions} />}

        {/* Agents du Mac */}
        <h3 className="mt-5 text-sm font-medium text-neutral-700">Agents du MacBook Pro (launchd)</h3>
        {lisible<Agent[]>(c.agents) ? (() => {
          const ecarts = c.agents.filter((a) => !OK.includes(a.verdict));
          return (
            <>
              <ul className="mt-1 space-y-1 text-sm">
                {ecarts.map((a) => (
                  <li key={a.label} className={ROUGE}>
                    {a.label.replace("com.patricktest.", "")} — {a.verdict}
                    {a.dernier_passage ? <span className="font-normal text-neutral-500"> · dernier passage {jour(a.dernier_passage)}</span> : null}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-sm text-emerald-800">
                {c.agents.length - ecarts.length} agent{c.agents.length - ecarts.length > 1 ? "s" : ""} sur {c.agents.length} tournent ou attendent leur heure.
              </p>
            </>
          );
        })() : <Illis titre="Agents" v={c.agents} />}

        {/* Migrations */}
        <h3 className="mt-5 text-sm font-medium text-neutral-700">Migrations pas encore en base</h3>
        {lisible<Pose[]>(c.poses) ? (
          c.poses.length === 0 ? <p className="mt-1 text-sm text-emerald-800">Aucune : tout ce qui est inscrit est en base.</p> : (
            <ul className="mt-1 space-y-1 text-sm">
              {c.poses.map((p) => (
                <li key={p.fichier} className={p.approuvee ? ROUGE : "text-neutral-700"}>
                  {p.quoi ?? p.fichier} — {p.sonde}{p.approuvee ? " · approuvée, attend « ! pose »" : " · pas encore approuvée"}
                  {p.carte ? <span className="font-normal text-neutral-500"> · carte {p.carte}</span> : null}
                </li>
              ))}
            </ul>
          )
        ) : <Illis titre="Migrations" v={c.poses} />}

        {/* Branches */}
        <h3 className="mt-5 text-sm font-medium text-neutral-700">Branches non fusionnées (21 derniers jours)</h3>
        {lisible<Branche[]>(c.branches) ? (
          c.branches.length === 0 ? <p className="mt-1 text-sm text-emerald-800">Aucune.</p> : (
            <ul className="mt-1 space-y-1 text-sm">
              {c.branches.map((b) => (
                <li key={b.depot + b.branche}>
                  <code>{b.depot}</code> · {b.branche}
                  <span className="text-neutral-500"> · {b.commits ?? "?"} commit{(b.commits ?? 0) > 1 ? "s" : ""} · {jour(b.le)} · {b.objet}</span>
                </li>
              ))}
            </ul>
          )
        ) : <Illis titre="Branches" v={c.branches} />}
      </section>

      <section>
        <h2 className="font-medium">Ponts, voix, Kanban, dépôts</h2>
        {lisible<Record<string, string>>(c.ponts) ? (
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {Object.entries(c.ponts).map(([z, e]) => (
              <li key={z} className={`rounded-md border px-2.5 py-1 ${e === "true"
                  ? "border-neutral-200 text-neutral-700" : "border-rose-300 bg-rose-50 font-medium text-rose-800"}`}>
                {z} {e === "true" ? "✓ connecté" : e === "false" ? "⛔ déconnecté" : "⛔ muet"}
              </li>
            ))}
          </ul>
        ) : <Illis titre="Ponts" v={c.ponts} />}

        {lisible<{ colonnes: Record<string, number>; voix: Voix[] }>(c.kanban) ? (
          <>
            <p className="mt-3 text-sm text-neutral-700">
              Kanban : {["humain", "cours", "afaire", "differe", "dette"].map((k) =>
                `${{ humain: "chez toi", cours: "en cours", afaire: "à faire", differe: "différé", dette: "dette" }[k]} ${c.kanban && "colonnes" in c.kanban ? c.kanban.colonnes[k] ?? 0 : 0}`).join(" · ")}
            </p>
            <table className="mt-2 text-sm">
              <thead className="text-left text-neutral-500">
                <tr><th className="py-1 pr-4 font-normal">Voix</th><th className="py-1 pr-4 font-normal">En cours</th>
                  <th className="py-1 pr-4 font-normal">À faire</th><th className="py-1 font-normal">Chez toi</th></tr>
              </thead>
              <tbody>
                {c.kanban.voix.map((v) => (
                  <tr key={v.voix} className="border-t border-neutral-100">
                    <td className="py-1 pr-4">{v.voix}</td>
                    <td className={`py-1 pr-4 tabular-nums ${v.cours >= 5 ? "text-rose-700 font-medium" : ""}`}>{v.cours}</td>
                    <td className="py-1 pr-4 tabular-nums">{v.afaire}</td>
                    <td className="py-1 tabular-nums">{v.humain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : <Illis titre="Kanban" v={c.kanban} />}

        <h3 className="mt-5 text-sm font-medium text-neutral-700">Travail resté sur le Mac</h3>
        {lisible<NonPousse[]>(c.non_pousses) ? (() => {
          const commits = c.non_pousses.filter((x) => x.commits_non_pousses > 0);
          const fichiers = c.non_pousses.filter((x) => x.commits_non_pousses === 0);
          return (
            <>
              <ul className="mt-1 space-y-1 text-sm">
                {commits.map((x) => (
                  <li key={x.clone} className={x.tete_age_h > 24 ? ROUGE : "text-neutral-700"}>
                    {x.clone} — {x.commits_non_pousses} commit{x.commits_non_pousses > 1 ? "s" : ""} non poussé{x.commits_non_pousses > 1 ? "s" : ""}
                    <span className="font-normal text-neutral-500"> · {x.tete_locale}</span>
                  </li>
                ))}
              </ul>
              {commits.length === 0 && <p className="mt-1 text-sm text-emerald-800">Aucun commit en attente d’être poussé.</p>}
              {fichiers.length > 0 && (
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer text-neutral-600">
                    {fichiers.length} clones avec des fichiers modifiés jamais commités
                  </summary>
                  <ul className="mt-1 grid gap-0.5 sm:grid-cols-2">
                    {fichiers.map((x) => <li key={x.clone}>{x.clone} <span className="text-neutral-500">· {x.fichiers_non_commites}</span></li>)}
                  </ul>
                </details>
              )}
            </>
          );
        })() : <Illis titre="Dépôts" v={c.non_pousses} />}
      </section>
    </>
  );
}
