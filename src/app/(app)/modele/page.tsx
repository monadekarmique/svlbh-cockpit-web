import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modèle économique" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 : « c'est clairement une question de volume pour
// laquelle nous avons bâti ce système », puis « on va créer une page de
// business modèle dans cockpit dans un menu NAV 15ème Monde ».
//
// ⚠️ TOUT EST CALCULÉ depuis v_modele_economique — rien n'est écrit en dur.
// Un modèle dont les chiffres sont figés dans une page ment le mois suivant.

type Modele = {
  outils_par_mois: number; exploitation_par_mois: number; charges_fixes: number;
  remuneration_annee: number; encaisse_moyen: number; reste_moyen: number;
  mois: number; femmes_payantes_3m: number;
  // v0.9.0 (DEC Patrick 25.09) : Supabase + Anthropic, les charges qui suivent le
  // nombre d'apprenantes — sur la fenêtre 2026 (pour les retirer de la part fixe)
  // et sur les 3 derniers mois (pour le coût par apprenante, même fenêtre que
  // femmes_payantes_3m).
  variables_par_mois: number; variables_par_mois_3m: number;
};

// Les hypothèses du modèle vivent dans modele_version, FIGÉES (append-only). Une
// version peut ne porter que ce qui change (v0.9.0 = delta sur v0.8.5) : on lit
// chaque paramètre dans la version la plus récente qui le porte.
type Version = { version: string; fige_le: string; parametres: Record<string, unknown> };
const semver = (v: string) => v.replace(/^v/, "").split(".").map((x) => Number(x) || 0);
function parVersion(versions: Version[]) {
  const triees = [...versions].sort((a, b) => {
    const [x, y] = [semver(a.version), semver(b.version)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0);
    }
    return 0;
  });
  const valeur = (chemin: string[], garde: (o: unknown) => boolean): unknown => {
    for (const v of triees) {
      let o: unknown = v.parametres;
      for (const k of chemin) o = o != null && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined;
      if (garde(o)) return o;
    }
    return null;
  };
  const lire = (chemin: string[]) => valeur(chemin, (o) => typeof o === "number") as number | null;
  const lireTexte = (chemin: string[]) => valeur(chemin, (o) => typeof o === "string") as string | null;
  return { derniere: triees[0] ?? null, lire, lireTexte };
}

const CHF = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 0, maximumFractionDigits: 0,
});
const CHF2 = new Intl.NumberFormat("fr-CH", {
  style: "currency", currency: "CHF", minimumFractionDigits: 2,
});

// ⚠️ Revue du 09.09 soir : « rien n'est écrit en dur » était faux — les tarifs du
// point de bascule étaient recopiés (29/59/79/100/179) et le commentaire disait que
// z3/z4 n'étaient pas fixés alors qu'ils l'étaient. Ils viennent maintenant de
// v_bareme (canaux) et de product_catalog (produits), lus dans la même page.
// `prix` nul = dit « à fixer » par le modèle (v0.9.1 : la consolidation myShaman
// Family a une durée, pas de prix) — montré, jamais caché ni inventé.
type Tarif = {
  label: string; prix: number | null; rythme: "mensuel" | "hebdo";
  duree?: string | null; precision?: string | null;
};
// Une année a 52 semaines : 52/12 semaines par mois, pas 4.
const SEMAINES_PAR_MOIS = 52 / 12;
type Bareme = { canal: string; mode: string; base: string; acceleration: string; lancement: string; complet: boolean };

export default async function ModelePage() {
  await requireSt6();
  const supabase = await createClient();
  const [{ data, error }, { data: bar, error: errBar }, { data: prods }, { data: vers, error: errVers }] = await Promise.all([
    supabase.from("v_modele_economique").select("*").maybeSingle(),
    supabase.from("v_bareme").select("*").order("canal"),
    supabase.from("product_catalog").select("code, label, price_ttc, kind")
      .in("code", ["MONITORING_ST2", "SOIN_CHLOE_PATTERN", "ABO_ACCELERATION_4S"]),
    supabase.from("modele_version").select("version, fige_le, parametres"),
  ]);
  const { derniere, lire, lireTexte } = parVersion((vers ?? []) as Version[]);
  const bareme = (bar ?? []) as Bareme[];
  const chf = (s: string | null | undefined) => Number(String(s ?? "").replace(/[^\d.]/g, "")) || 0;
  // ⚠️ z1 n'est plus écrit en dur (il l'était à 29) : DEC Patrick 25.09, v0.9.0.
  const z1 = lire(["bareme", "z1"]);
  const reverseDecouverte = lire(["decouverte_z1", "reverse_a_patrick"]);
  const z2 = bareme.find((b) => b.canal === "z2"), z3 = bareme.find((b) => b.canal === "z3");
  const prix = (code: string) => Number(prods?.find((p) => p.code === code)?.price_ttc ?? 0);
  const TARIFS: Tarif[] = [
    { label: "Programme découverte z1 — reversé par l’animateur", prix: reverseDecouverte, rythme: "hebdo" as const },
    // Les parcours (v0.9.1, DEC Patrick 25.09) : supervision active puis consolidation.
    { label: "myShaman — supervision active du mentor", prix: lire(["myshaman", "supervision_active_mois"]),
      duree: lireTexte(["myshaman", "supervision_active_duree"]), rythme: "mensuel" as const },
    { label: "myShaman — consolidation, sans supervision globale", prix: lire(["myshaman", "consolidation_mois"]),
      duree: lireTexte(["myshaman", "consolidation_duree"]), rythme: "mensuel" as const },
    { label: "myShaman Family — supervision active du mentor", prix: lire(["myshamanfamily", "supervision_active_mois"]),
      duree: lireTexte(["myshamanfamily", "supervision_active_duree"]), rythme: "mensuel" as const },
    { label: "myShaman Family — consolidation", prix: lire(["myshamanfamily", "consolidation_mois"]),
      duree: lireTexte(["myshamanfamily", "consolidation_duree"]), rythme: "mensuel" as const },
    { label: lireTexte(["vibration_therapeute", "nom"]) ?? "Programme Vibration de thérapeute",
      prix: lire(["vibration_therapeute", "prix_mois"]), duree: lireTexte(["vibration_therapeute", "duree"]),
      precision: lireTexte(["vibration_therapeute", "option"]), rythme: "mensuel" as const },
    { label: "Forfait z2 — accès aux applications", prix: chf(z2?.base), rythme: "mensuel" as const },
    { label: "Forfait z3", prix: chf(z3?.base), rythme: "mensuel" as const },
    { label: "Monitoring ST2", prix: prix("MONITORING_ST2"), rythme: "mensuel" as const },
    { label: "Soin 3 Âmes et + (avec don de soutien)", prix: prix("SOIN_CHLOE_PATTERN"), rythme: "mensuel" as const },
    { label: "Accélération, 1 mois", prix: chf(z2?.acceleration) || prix("ABO_ACCELERATION_4S"), rythme: "mensuel" as const },
  ].filter((t) => t.prix === null || t.prix > 0);

  if (error || errBar || errVers || !data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Modèle économique</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">
          {error?.message ?? errBar?.message ?? errVers?.message ?? "Aucune donnée visible pour ce compte — le modèle est réservé au propriétaire."}
        </p>
      </main>
    );
  }
  const m = data as Modele;
  const n = (v: unknown) => Number(v ?? 0);
  // Ce qui ne bouge pas avec le nombre : les charges relevées MOINS Supabase et
  // Anthropic (même fenêtre 2026), plus ce que la banque ne montre pas.
  const fixesReleves = n(m.charges_fixes) - n(m.variables_par_mois);
  const salaire = lire(["charges_patrick", "salaire_net_mois"]) ?? 0; // v0.9.2, DEC Patrick 25.09
  const caisseMaladie = lire(["charges_patrick", "caisse_maladie_mois"]) ?? 0;
  const electricite = lire(["charges_patrick", "electricite_mois"]) ?? 0;
  const chargesSociales = lire(["charges_patrick", "charges_sociales_mois"]) ?? 0;
  const fixe = fixesReleves + salaire + caisseMaladie + electricite + chargesSociales;
  // Ce qui suit le nombre. DEC Patrick 25.09 (v0.9.1) : « une apprenante va me
  // coûter CHF 129 par an » — c'est ce chiffre qui compte. La mesure bancaire
  // (Supabase + Anthropic des 3 derniers mois ÷ femmes qui ont payé) ne sert que
  // si aucune version ne porte de coût.
  const femmes = n(m.femmes_payantes_3m);
  const coutAn = lire(["charges_patrick", "cout_apprenante_an"]);
  const parApprenante = coutAn != null ? coutAn / 12 : femmes > 0 ? n(m.variables_par_mois_3m) / femmes : 0;
  const ilEnFaut = (t: Tarif): number | null => {
    if (t.prix == null) return null;
    if (t.rythme === "hebdo") return Math.ceil(fixe / t.prix);
    const net = t.prix - parApprenante;
    return net > 0 ? Math.ceil(fixe / net) : null;
  };

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Modèle économique</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Calculé sur {n(m.mois)} mois de relevés 2026
          {derniere && <> et les hypothèses <a className="underline" href="/versions">{derniere.version}</a> du {new Date(derniere.fige_le).toLocaleDateString("fr-CH")}</>}
          {" "}— aucun chiffre écrit en dur.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["À couvrir / mois", CHF2.format(fixe), "fixes + salaire + caisse maladie + électricité"],
          ["Coût par apprenante / mois", CHF2.format(parApprenante),
            coutAn != null ? `${CHF.format(coutAn)} par an` : "Supabase + Anthropic, 3 mois"],
          ["Encaissé / mois", CHF2.format(n(m.encaisse_moyen)), "moyenne 2026"],
          ["Reste / mois", CHF2.format(n(m.reste_moyen)), "après TVA et charges"],
          ["Femmes qui paient", String(n(m.femmes_payantes_3m)), "3 derniers mois"],
        ].map(([t, v, s]) => (
          <div key={t} className="rounded-xl border border-neutral-200 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{t}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
            <div className="mt-0.5 text-xs text-neutral-400">{s}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Le point de bascule</h2>
        <p className="text-sm text-neutral-600">
          Une partie des charges <strong>suit le nombre d’apprenantes</strong> — Supabase et
          Anthropic :{" "}
          {coutAn != null
            ? <>une apprenante coûte <strong className="tabular-nums">{CHF.format(coutAn)} par an</strong>,
                soit <strong className="tabular-nums">{CHF2.format(parApprenante)}</strong> par mois.</>
            : <>{CHF2.format(n(m.variables_par_mois_3m))} par mois sur les trois derniers mois, pour{" "}
                {femmes} femmes qui paient, soit{" "}
                <strong className="tabular-nums">{CHF2.format(parApprenante)}</strong> par apprenante et par mois.</>}
          {" "}Le reste ne bouge pas avec le nombre — et il ne tient pas tout entier dans la
          banque :
        </p>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-100">
              {([
                ["Outils et exploitation, hors Supabase et Anthropic", fixesReleves, "relevés 2026, moyenne mensuelle"],
                ["Salaire net de Patrick", salaire, "hors banque — à compter"],
                ["Caisse maladie", caisseMaladie, "hors banque — pas payée aujourd’hui"],
                ["Électricité", electricite, "hors banque"],
                ["Charges sociales", chargesSociales, "aucune générée aujourd’hui"],
              ] as [string, number, string][]).map(([t, v, src]) => (
                <tr key={t}>
                  <td className="px-3 py-2">{t}</td>
                  <td className="px-3 py-2 text-xs text-neutral-500">{src}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{CHF2.format(v)}</td>
                </tr>
              ))}
              <tr className="bg-neutral-50 font-medium">
                <td className="px-3 py-2">À couvrir chaque mois</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right tabular-nums">{CHF2.format(fixe)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-600">
          Il faut donc, pour couvrir {CHF2.format(fixe)} chaque mois — chaque apprenante coûtant{" "}
          {CHF2.format(parApprenante)} avant de rapporter :
        </p>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Ce qu’elle verse</th>
                <th className="px-3 py-2">Rythme</th>
                <th className="px-3 py-2 text-right">Prix</th>
                <th className="px-3 py-2 text-right">Il en faut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {TARIFS.map((t) => {
                const k = ilEnFaut(t);
                return (
                  <tr key={t.label}>
                    <td className="px-3 py-2">
                      {t.label}
                      {t.precision && <span className="block text-xs text-neutral-500">{t.precision}</span>}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {t.rythme === "mensuel"
                        ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-900">
                            mensuel{t.duree ? ` · ${t.duree}` : ""}
                          </span>
                        : <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">par semaine et par animateur</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {t.prix == null ? <span className="text-amber-700">à fixer</span> : CHF.format(t.prix)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {t.prix == null
                        ? <span className="text-neutral-400">—</span>
                        : k == null
                        ? <span className="text-rose-700">jamais</span>
                        : t.rythme === "hebdo"
                          ? <>{k} animations / mois
                              <span className="block text-xs font-normal text-neutral-400">
                                ≈ {Math.ceil(fixe / (t.prix! * SEMAINES_PAR_MOIS))} animateurs chaque semaine
                              </span>
                            </>
                          : k}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-neutral-500">
          Programme découverte z1 : {z1 != null ? CHF.format(z1) : "—"} par participante, 5 × 4 heures
          dans la semaine ; l’animateur encaisse jusqu’à 9 participantes et en reverse{" "}
          {reverseDecouverte != null ? CHF.format(reverseDecouverte) : "—"} — c’est ce versement qui
          entre ici. Le coût d’une participante sur cinq jours n’est pas mesuré : il n’est
          pas retiré. Pour les versements mensuels, le coût par apprenante est retiré du prix avant
          de compter.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Où le volume cesse de porter</h2>
        <div className="rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-800">
          <p>
            <strong>Un soin porté seul est presque toute marge</strong> — chaque versement
            supplémentaire tombe presque entier, moins{" "}
            <span className="tabular-nums">{CHF2.format(parApprenante)}</span> par mois et par
            apprenante (Supabase et Anthropic).
          </p>
          <p className="mt-2">
            <strong>Un soin co-réalisé ne l’est pas, et ce n’est pas un défaut.</strong>{" "}
            Ce qui est reversé à la praticienne qui co-réalise n’est pas une marge perdue :
            l’argent entre chez Patrick, l’infrastructure est mise à disposition, le reste
            est reversé — c’est le modèle (DEC 09.09.2026). Reversé en 2026 :{" "}
            <span className="tabular-nums font-medium">{CHF2.format(n(m.remuneration_annee))}</span>.
          </p>
          <p className="mt-2 text-neutral-600">
            Le levier sur ces soins est donc <strong>le prix</strong>, pas la clé de partage.
            État daté du 09.09.2026 — les décisions vivent dans le Kanban et dans{" "}
            <a className="underline" href="/versions">les versions du modèle</a>, pas ici.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Le barème des canaux</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2">Mode</th>
                <th className="px-3 py-2 text-right">Base</th>
                <th className="px-3 py-2 text-right">Accélération</th>
                <th className="px-3 py-2 text-right">Lancement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr>
                <td className="px-3 py-2">z1</td>
                <td className="px-3 py-2 text-neutral-600">à l’unité</td>
                <td className="px-3 py-2 text-right tabular-nums">{z1 != null ? `${z1} CHF` : "à fixer"}</td>
                <td className="px-3 py-2 text-right text-neutral-400">—</td>
                <td className="px-3 py-2 text-right text-neutral-400">—</td>
              </tr>
              {bareme.map((b) => (
                <tr key={b.canal}>
                  <td className="px-3 py-2">{b.canal}</td>
                  <td className="px-3 py-2 text-neutral-600">
                    {b.mode === "forfait" ? "forfait mensuel" : "% du chiffre d’affaires"}
                  </td>
                  <td className={"px-3 py-2 text-right tabular-nums " + (b.complet ? "" : "text-amber-700")}>
                    {b.complet ? b.base : "à fixer"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{b.acceleration}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-neutral-500">{b.lancement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-600">
          Le <strong>forfait facture ce qu’on donne</strong>, le{" "}
          <strong>pourcentage suit ce qu’elle gagne</strong> — d’où l’inversion
          apparente : en z3 le lancement coûte plus cher que l’accélération, en z4
          il coûte moins. Une femme qui lance sa pratique gagne peu.
          <br />
          <strong>Il n’y a pas de tarif « praticienne établie »</strong>, et il ne
          faut pas en créer un : celle qui arrive avec un cabinet passe quand même
          par z2 puis z3 — l’accélération n’achète que de la vitesse, jamais un
          palier. Giulia : z1 → z3 en 61 jours, sans en sauter aucun.
        </p>
      </section>
    </main>
  );
}
