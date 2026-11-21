import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Semaine d'accélération · page d'auteur" };
export const dynamic = "force-dynamic";

// Page d'AUTEUR de la Semaine d'accélération (Patrick, 21.11.2026 : « 1 et 2 » — 2 = « une page d'auteur pour toi seul :
// les 36 modules avec les liens à vérifier, les liens sans bloc, et les modules à retester »).
//
// Tout est LU EN BASE à chaque affichage : le programme, ses 36 blocs, leurs liens (auto_soin_module_lien) et les chapitres
// des livres (livre_chapitre). Rien n'est recopié ici — la liste « à retester à 300 % » vit dans
// auto_soin_program.day_subtitles.a_retester, avec sa date et ses mots : un état écrit dans une page ment dès qu'il change.
//
// GATE = RLS : auto_soin_module_lien et livre_chapitre ne se lisent que par is_owner_st6() → requireSt6, pas moins.

const SLUG = "semaine-acceleration-conscience-universelle";
const PRIV = "https://priv.svlbh.com/programmes/";

type Bloc = { id: string; slug: string; label: string; description: string | null };
type Rang = { module_id: string; sort_order: number; day_index: number | null; auto_soin_module: Bloc | Bloc[] | null };
type Lien = {
  module_id: string; rang: number; type: "programme" | "livre" | "app" | "tutoriel";
  programme_id: string | null; bloc_id: string | null; cite: string | null; a_verifier: boolean;
  livre_chapitre_id: string | null; nom: string | null;
};
type Prog = { id: string; slug: string; label: string; audience: string | null; is_published: boolean };
type Chapitre = { id: string; tome: string; tome_titre: string; chapitre: string; titre_public: string | null; etat: string; fichier: string | null };
type ARetester = { modules?: number[]; depuis?: string; mots?: string };

function niveau(audience: string | null): string {
  const m = audience?.match(/^apprenante-st([1-9])$/);
  if (m) return `ST${m[1]}+`;
  return audience === "cercle-decodage" || audience === "cercle_auto_soin" ? "Cercle" : "ST4+";
}

const ETAT: Record<string, string> = { prevu: "prévu", redige: "rédigé", publie: "publié" };

function Erreur({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Semaine d&apos;accélération</h1>
      <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">{message}</p>
    </main>
  );
}

export default async function SemaineAccelerationAuteur() {
  await requireSt6();
  const sb = await createClient();

  const { data: programme, error: e1 } = await sb
    .from("auto_soin_program")
    .select("id, slug, label, audience, is_published, published_at, workflow_status, day_subtitles")
    .eq("slug", SLUG)
    .maybeSingle();
  if (e1) return <Erreur message={e1.message} />;
  if (!programme) return <Erreur message="Le programme n'est pas en base (migration 2026-11-21b)." />;

  const { data: rangsRaw, error: e2 } = await sb
    .from("auto_soin_program_module")
    .select("module_id, sort_order, day_index, auto_soin_module(id, slug, label, description)")
    .eq("program_id", programme.id)
    .order("sort_order");
  if (e2) return <Erreur message={e2.message} />;
  const modules = ((rangsRaw ?? []) as unknown as Rang[])
    .map((r) => {
      const b = Array.isArray(r.auto_soin_module) ? r.auto_soin_module[0] : r.auto_soin_module;
      return b ? { n: r.sort_order, parcours: r.day_index, bloc: b } : null;
    })
    .filter((m): m is { n: number; parcours: number | null; bloc: Bloc } => m !== null);
  const ids = modules.map((m) => m.bloc.id);

  const { data: liensRaw, error: e3 } = await sb
    .from("auto_soin_module_lien")
    .select("module_id, rang, type, programme_id, bloc_id, cite, a_verifier, livre_chapitre_id, nom")
    .in("module_id", ids)
    .order("rang");
  if (e3) return <Erreur message={e3.message} />;
  const liens = (liensRaw ?? []) as Lien[];

  const idsDe = (cle: "programme_id" | "bloc_id" | "livre_chapitre_id") =>
    [...new Set(liens.map((l) => l[cle]).filter((x): x is string => !!x))];
  const [{ data: progs }, { data: blocsLies }, { data: joursLies }, { data: chapitres }] = await Promise.all([
    sb.from("auto_soin_program").select("id, slug, label, audience, is_published").in("id", idsDe("programme_id")),
    sb.from("auto_soin_module").select("id, label").in("id", idsDe("bloc_id")),
    sb.from("auto_soin_program_module").select("program_id, module_id, day_index").in("module_id", idsDe("bloc_id")),
    sb.from("livre_chapitre").select("id, tome, tome_titre, chapitre, titre_public, etat, fichier").order("tome"),
  ]);
  const progDe = new Map(((progs ?? []) as Prog[]).map((p) => [p.id, p]));
  const blocDe = new Map(((blocsLies ?? []) as { id: string; label: string }[]).map((b) => [b.id, b.label]));
  const jourDe = new Map(
    ((joursLies ?? []) as { program_id: string; module_id: string; day_index: number | null }[]).map((j) => [
      `${j.program_id}|${j.module_id}`,
      j.day_index,
    ]),
  );
  const tousChapitres = (chapitres ?? []) as Chapitre[];
  const chapitreDe = new Map(tousChapitres.map((c) => [c.id, c]));
  const moduleDe = new Map(modules.map((m) => [m.bloc.id, m]));

  const adresse = (l: Lien): string | null => {
    const p = l.programme_id ? progDe.get(l.programme_id) : null;
    if (!p) return null;
    const jour = l.bloc_id ? jourDe.get(`${p.id}|${l.bloc_id}`) : null;
    return PRIV + p.slug + (jour && jour >= 1 ? `/jour/${jour}` : "");
  };

  const sousTitres = (programme.day_subtitles ?? {}) as Record<string, unknown>;
  const aRetester = (sousTitres.a_retester ?? null) as ARetester | null;
  const numerosARetester = new Set(aRetester?.modules ?? []);
  const liensProgramme = liens.filter((l) => l.type === "programme");
  const aVerifier = liensProgramme.filter((l) => l.a_verifier && l.bloc_id);
  const sansBloc = liensProgramme.filter((l) => !l.bloc_id);
  const liensLivre = liens.filter((l) => l.type === "livre");
  const tomes = [...new Set(tousChapitres.map((c) => c.tome))].sort();
  const titre = (label: string) => label.replace(/^Module \d+ — /, "");
  const parcours = [...new Set(modules.map((m) => m.parcours))].filter((p): p is number => p !== null).sort((a, b) => a - b);

  const LigneDeLien = ({ l }: { l: Lien }) => {
    const m = moduleDe.get(l.module_id);
    const p = l.programme_id ? progDe.get(l.programme_id) : null;
    const url = adresse(l);
    return (
      <tr className="border-t border-neutral-200 align-top">
        <td className="py-2 pr-3 font-semibold whitespace-nowrap">
          <a href={`#m${m?.n}`} className="text-[#8B3A62] hover:underline">Module {m?.n}</a>
        </td>
        <td className="py-2 pr-3">
          {url ? <a href={url} className="font-medium hover:underline">{p?.label}</a> : (p?.label ?? "—")}
          <span className="ml-2 text-xs text-neutral-500">{p ? niveau(p.audience) : ""}</span>
        </td>
        <td className="py-2 pr-3 text-neutral-700">{l.cite ?? "—"}</td>
        <td className="py-2 text-neutral-700">{l.bloc_id ? (blocDe.get(l.bloc_id) ?? "—") : <em>aucun bloc retrouvé</em>}</td>
      </tr>
    );
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{programme.label} — page d&apos;auteur</h1>
        <p className="text-sm text-neutral-600">
          {programme.is_published ? "Publié" : "Non publié"}
          {programme.published_at ? ` le ${new Date(programme.published_at).toLocaleString("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" })}` : ""}
          {" · "}statut « {programme.workflow_status} » · audience {programme.audience ?? "—"} ·{" "}
          <a href={PRIV + programme.slug} className="text-[#8B3A62] underline">la voir sur priv.svlbh.com</a>
        </p>
        <dl className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-5">
          {[
            [modules.length, "modules"],
            [numerosARetester.size, "à retester à 300 %"],
            [aVerifier.length, "blocs à vérifier"],
            [sansBloc.length, "liens sans bloc"],
            [liensLivre.length, "liens vers les livres"],
          ].map(([n, quoi]) => (
            <div key={String(quoi)} className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-neutral-500">{quoi}</dt>
              <dd className="text-2xl font-semibold text-[#8B3A62]">{n}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-semibold text-amber-900">À retester à 300 %</h2>
        {numerosARetester.size ? (
          <>
            <p className="mt-1 text-sm text-amber-900">
              {aRetester?.mots ? <>Tes mots{aRetester.depuis ? ` du ${aRetester.depuis}` : ""} : « {aRetester.mots} »</> : null}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {modules.filter((m) => numerosARetester.has(m.n)).map((m) => (
                <li key={m.n}>
                  <a href={`#m${m.n}`} className="font-semibold text-amber-900 underline">Module {m.n}</a> — {titre(m.bloc.label)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-sm text-amber-900">Aucun module n&apos;est marqué à retester.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Blocs à vérifier ({aVerifier.length})</h2>
        <p className="text-sm text-neutral-600">
          Le module cite un bloc ; le bloc retrouvé en base l&apos;a été par sa place dans le programme, pas par son titre. À confirmer ou à corriger.
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-500">
            <tr><th className="py-1 pr-3">Module</th><th className="py-1 pr-3">Programme</th><th className="py-1 pr-3">Ce que le module cite</th><th className="py-1">Bloc retrouvé</th></tr>
          </thead>
          <tbody>{aVerifier.map((l) => <LigneDeLien key={`${l.module_id}-${l.rang}`} l={l} />)}</tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Liens sans bloc ({sansBloc.length})</h2>
        <p className="text-sm text-neutral-600">Le lien mène au programme entier : aucun bloc ne correspond à ce que le module cite.</p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-500">
            <tr><th className="py-1 pr-3">Module</th><th className="py-1 pr-3">Programme</th><th className="py-1 pr-3">Ce que le module cite</th><th className="py-1">Bloc</th></tr>
          </thead>
          <tbody>{sansBloc.map((l) => <LigneDeLien key={`${l.module_id}-${l.rang}`} l={l} />)}</tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Les livres ({tousChapitres.length} chapitres cités)</h2>
        <table className="mt-2 w-full max-w-2xl text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-500">
            <tr><th className="py-1 pr-3">Tome</th><th className="py-1 pr-3">Prévus</th><th className="py-1 pr-3">Rédigés</th><th className="py-1">Publiés</th></tr>
          </thead>
          <tbody>
            {tomes.map((t) => {
              const c = tousChapitres.filter((x) => x.tome === t);
              const n = (etat: string) => c.filter((x) => x.etat === etat).length;
              return (
                <tr key={t} className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 font-medium">{c[0]?.tome_titre ?? t}</td>
                  <td className="py-1.5 pr-3">{n("prevu")}</td><td className="py-1.5 pr-3">{n("redige")}</td><td className="py-1.5">{n("publie")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1 text-xs text-neutral-500">Tant qu&apos;un chapitre n&apos;est pas « publié », les lectrices lisent « à paraître ».</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Les {modules.length} modules et leurs liens</h2>
        {parcours.map((p) => (
          <div key={p} className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#8B3A62]">{String(sousTitres[String(p)] ?? `Parcours ${p}`)}</h3>
            {modules.filter((m) => m.parcours === p).map((m) => {
              const siens = liens.filter((l) => l.module_id === m.bloc.id);
              return (
                <details key={m.n} id={`m${m.n}`} className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
                  <summary className="cursor-pointer font-medium">
                    <span className="mr-2 inline-block w-7 text-[#8B3A62]">{m.n}</span>
                    {titre(m.bloc.label)}
                    {numerosARetester.has(m.n) ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">à retester</span> : null}
                    {siens.some((l) => l.a_verifier && l.bloc_id) ? <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-900">bloc à vérifier</span> : null}
                    {siens.some((l) => l.type === "programme" && !l.bloc_id) ? <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">lien sans bloc</span> : null}
                    <span className="ml-2 text-xs text-neutral-500">{siens.length} liens</span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-sm text-neutral-800">{(m.bloc.description ?? "").replace(/\*\*/g, "").replace(/(^|\n)\*(.+)\*(?=\n|$)/g, "$1$2")}</p>
                  <table className="mt-3 w-full text-left text-sm">
                    <tbody>
                      {siens.map((l) => {
                        const pr = l.programme_id ? progDe.get(l.programme_id) : null;
                        const ch = l.livre_chapitre_id ? chapitreDe.get(l.livre_chapitre_id) : null;
                        const url = adresse(l);
                        return (
                          <tr key={l.rang} className="border-t border-neutral-100 align-top">
                            <td className="w-24 py-1.5 pr-3 text-xs uppercase tracking-wide text-neutral-500">{l.type}</td>
                            <td className="py-1.5 pr-3">
                              {l.type === "programme" ? (
                                <>
                                  {url ? <a href={url} className="font-medium hover:underline">{pr?.label}</a> : (pr?.label ?? "—")}
                                  <span className="block text-xs text-neutral-500">
                                    {l.bloc_id ? blocDe.get(l.bloc_id) : `cité : ${l.cite ?? "—"}`}
                                  </span>
                                </>
                              ) : l.type === "livre" ? (
                                <>
                                  <span className="font-medium">{ch?.titre_public ?? ch?.chapitre ?? "—"}</span>
                                  <span className="block text-xs text-neutral-500">
                                    {ch?.tome_titre}{l.cite ? ` — ${l.cite}` : ""}{ch?.fichier ? ` · ${ch.fichier}` : ""}
                                  </span>
                                </>
                              ) : (
                                l.nom
                              )}
                            </td>
                            <td className="w-28 py-1.5 text-right text-xs text-neutral-600">
                              {l.type === "programme" ? (pr ? niveau(pr.audience) : "") : l.type === "livre" ? (ETAT[ch?.etat ?? ""] ?? "") : ""}
                              {l.type === "programme" && l.a_verifier && l.bloc_id ? " · à vérifier" : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </details>
              );
            })}
          </div>
        ))}
      </section>
    </main>
  );
}
