// Préparation — Audit des entités familiales (DEC Patrick 2026-08-07, réponse « 3 » :
// « crée une page dans cockpit.svlbh.com/preparation audit-entites-familiales »).
// Gate ST6 strict (requireSt6), section Préparation Soins au Cabinet.
//
// Objet : la RELECTURE du corpus araméen — les 19 sigils avec leurs explications VLBH
// viennent d'entrer dans svlbh-core (v0.21.0, 5ᵉ alphabet sacré, source VIFA) et sont
// désormais lus par toutes les apps dans le ruban de soin de l'Audit. Ces 19 textes ont
// été générés le 24.04.2026 et jamais relus par Patrick ; les 3 lettres absentes du
// corpus (Gimel, Zayin, Qoph) attendent sa dictée. Cette page est la surface de
// relecture — le contenu est une COPIE de lecture, la source de vérité reste core
// (sacred-scripts.json).

import Link from "next/link";
import { requireSt6 } from "@/lib/owner-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Sigil = {
  glyph: string;
  nom: string;
  gematria: number;
  explication: string;
};

// Copie de lecture de core v0.21.0 (Resources/sacred-scripts.json, id "aramaic") —
// jointure gématria par glyphe, noms harmonisés VIFA (DEC 07.08).
const SIGILS: Sigil[] = [
  { glyph: "𐡀", nom: "Aleph", gematria: 1, explication: "Souffle originel, silence avant le Verbe — premier battement de la Monade." },
  { glyph: "𐡁", nom: "Beth", gematria: 2, explication: "Maison, réceptacle du sacré — marque l'incarnation au chakra racine." },
  { glyph: "𐡃", nom: "Daleth", gematria: 4, explication: "Porte, passage dimensionnel — ouvre la traversée S0 → S1." },
  { glyph: "𐡄", nom: "He", gematria: 5, explication: "Souffle d'incarnation — descente de l'Esprit dans la chair." },
  { glyph: "𐡅", nom: "Waw", gematria: 6, explication: "Crochet, lien ciel-terre — fil du Pont Cœur Supérieur (C9)." },
  { glyph: "𐡇", nom: "Heth", gematria: 8, explication: "Clôture, limites sacrées — sert au décordage thérapeute-patient." },
  { glyph: "𐡈", nom: "Teth", gematria: 9, explication: "Serpent lové, kundalini — potentiel enroulé à la base." },
  { glyph: "𐡉", nom: "Yodh", gematria: 10, explication: "Main, action divine — plus petit trait, graine de lumière." },
  { glyph: "𐡊", nom: "Kaph", gematria: 20, explication: "Paume creuse, offrande — posture d'accueil du Johrei." },
  { glyph: "𐡋", nom: "Lamedh", gematria: 30, explication: "Aiguillon, enseignement — correction guidée de la lignée." },
  { glyph: "𐡌", nom: "Mem", gematria: 40, explication: "Eaux primordiales — icosaèdre, élément liquide transgénérationnel." },
  { glyph: "𐡍", nom: "Nun", gematria: 50, explication: "Poisson, âme plongée — Nefesh dans la matière." },
  { glyph: "𐡎", nom: "Samekh", gematria: 60, explication: "Support, Arbre de Vie — soutien sephirotique." },
  { glyph: "𐡏", nom: "Ayin", gematria: 70, explication: "Œil, regard intérieur — vision radiesthésique du praticien." },
  { glyph: "𐡐", nom: "Pe", gematria: 80, explication: "Bouche, Verbe — formule du mythe réécrit (C15)." },
  { glyph: "𐡑", nom: "Sadhe", gematria: 90, explication: "Justice, redressement — restitution karmique." },
  { glyph: "𐡓", nom: "Resh", gematria: 200, explication: "Tête, principe — retour au router galactique (C12)." },
  { glyph: "𐡔", nom: "Shin", gematria: 300, explication: "Feu, transformation — tétraèdre, impulsion initiale." },
  { glyph: "𐡕", nom: "Taw", gematria: 400, explication: "Croix, scellement final — signature de clôture SLA = 100%." },
];

const A_DICTER: Sigil[] = [
  { glyph: "𐡂", nom: "Gimel", gematria: 3, explication: "" },
  { glyph: "𐡆", nom: "Zayin", gematria: 7, explication: "" },
  { glyph: "𐡒", nom: "Qoph", gematria: 100, explication: "" },
];

export default async function AuditEntitesFamilialesPage() {
  await requireSt6();

  return (
    <div className="space-y-5">
      <Link
        href="/soins-cabinet"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← Préparation Soins au Cabinet
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          Audit des entités familiales — sigils araméens
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-neutral-700">
          Les 19 sigils de l&rsquo;araméen impérial (corpus VIFA) sont entrés dans
          la doctrine partagée (core v0.21.0, 5ᵉ alphabet sacré) : ils apparaissent
          dans le ruban de soin de l&rsquo;Audit, avec leur gématria à droite, dans
          toutes les apps. <strong>Cette page est ta surface de relecture</strong> —
          les 19 explications datent du 24.04.2026 et n&rsquo;ont jamais été relues.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-blue-950">
          Les 19 sigils en service <span className="text-sm font-semibold text-amber-700">— à relire</span>
        </h2>
        <ul className="mt-3 divide-y divide-neutral-100">
          {SIGILS.map((s) => (
            <li key={s.nom} className="flex items-baseline gap-4 py-2.5">
              <span className="w-10 shrink-0 text-3xl" style={{ color: "#4F46E5" }}>
                {s.glyph}
              </span>
              <span className="w-24 shrink-0 text-sm font-bold text-neutral-900">
                {s.nom}
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-sm font-bold" style={{ color: "#4F46E5" }}>
                {s.gematria}
              </span>
              <span className="min-w-0 flex-1 text-sm text-neutral-700">{s.explication}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-amber-900">
          Les 3 lettres qui attendent ta dictée
        </h2>
        <p className="mt-1 text-sm text-amber-800">
          Absentes du corpus VIFA — <strong>aucune explication n&rsquo;a été inventée</strong> :
          une phrase de doctrine fabriquée serait indistinguable des 19 vraies. Dicte-les
          (ici, en séance, ou sur WhatsApp) et elles descendront dans core.
        </p>
        <ul className="mt-3 divide-y divide-amber-200/60">
          {A_DICTER.map((s) => (
            <li key={s.nom} className="flex items-baseline gap-4 py-2.5">
              <span className="w-10 shrink-0 text-3xl text-amber-900">{s.glyph}</span>
              <span className="w-24 shrink-0 text-sm font-bold text-amber-900">{s.nom}</span>
              <span className="w-10 shrink-0 text-right font-mono text-sm font-bold text-amber-900">
                {s.gematria}
              </span>
              <span className="min-w-0 flex-1 text-sm italic text-amber-700">
                — explication à dicter —
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-neutral-500">
        Source de vérité : svlbh-core (sacred-scripts.json, jointure gématria par glyphe,
        noms harmonisés VIFA — DEC 07.08). Toute correction relue ici sera reportée dans
        core et vaudra pour toutes les apps d&rsquo;un coup.
      </p>
    </div>
  );
}
