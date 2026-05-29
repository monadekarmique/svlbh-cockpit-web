// Session documentée — HANDOVER-TYPES-DE-LMASC-PSYCHOSOMATIQUE.
// Source canonique : ~/Developer/svlbh-handovers/active/2026-05-15-types-de-lmasc-psychosomatique/
// Auteur : Patrick Bays × Claude.ai.

export const SESSION_META = {
  id: "HANDOVER-TYPES-DE-LMASC-PSYCHOSOMATIQUE",
  date: "2026-05-15",
  titre: "Types de DE (Décodage Énergétique) sur la Lmasc",
  sousTitre: "Grille canonique 36 types — Reins / Foie / Rate × Psychosomatique Hamer-Sabbah",
  auteur: "Patrick Bays × Claude.ai",
  destination: "Claude terminal (patricktest / MBP)",
  statut: "active" as const,
};

export function TypesDeLmascSession() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-neutral-800">
      {/* En-tête */}
      <header className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <dl className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
          <div><dt className="inline font-bold">ID&nbsp;:</dt> <dd className="inline font-mono">{SESSION_META.id}</dd></div>
          <div><dt className="inline font-bold">Date&nbsp;:</dt> <dd className="inline">{SESSION_META.date}</dd></div>
          <div><dt className="inline font-bold">Statut&nbsp;:</dt> <dd className="inline">active/</dd></div>
          <div><dt className="inline font-bold">Auteur&nbsp;:</dt> <dd className="inline">{SESSION_META.auteur}</dd></div>
          <div className="sm:col-span-2"><dt className="inline font-bold">Destination&nbsp;:</dt> <dd className="inline">{SESSION_META.destination}</dd></div>
        </dl>
      </header>

      {/* 1. Contexte */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">1. Contexte</h3>
        <p>
          La <strong>Lmasc</strong> (Lignée Masculine) est le canal énergétique direct père → fils depuis Adam.
          L&apos;énergie sexuelle masculine est réceptionnée par les Reins, lieu symbolique de l&apos;héritage
          ancestral (cf. skill <code className="rounded bg-neutral-100 px-1">vibration-originelle-</code>). Ce
          « tuyau » transmet non seulement la force vitale mais aussi les pollutions les plus sévères :
          il est impossible à l&apos;individu d&apos;échapper aux informations pathologiques puisqu&apos;elles
          arrivent directement par la SOURCE même de la Vie.
        </p>
        <p className="mt-2">
          Chaque pollution Lmasc se manifeste différemment selon l&apos;organe cible. Le{" "}
          <strong>Décodage Énergétique (DE)</strong> identifie le type spécifique de cette manifestation
          en croisant la psychosomatique clinique (Hamer / Sabbah) avec le cadre VLBH (hDOM, Sephiroth,
          Rose des Vents, Phantom Matrix, MTC). Ce handover prépare la <strong>grille canonique</strong>{" "}
          des 36 types de DE observables sur la Lmasc, organisés par organe.
        </p>
      </section>

      {/* 2. Objectif */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">2. Objectif</h3>
        <p>
          Co-construire avec Patrick, en séance itérative, la grille complète des{" "}
          <strong>36 types de DE sur la Lmasc</strong> :
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1">
          <li><strong>12 types sur les Reins (KI)</strong> — récepteur de l&apos;héritage, Eau, Peur, Zhi</li>
          <li><strong>12 types sur le Foie (LR)</strong> — colère/Hun, Bois, stagnation du Qi</li>
          <li><strong>12 types sur la Rate (SP)</strong> — rumination/Yi, Terre, transformation</li>
        </ul>
        <p className="mt-2">
          Chaque organe a sa <em>propre taxonomie</em> — les 12 types ne suivent pas un découpage transversal commun.
        </p>
        <p className="mt-2">Deux livrables :</p>
        <ol className="ml-5 mt-1 list-decimal space-y-1">
          <li><strong>Skill VLBH</strong> : <code className="rounded bg-neutral-100 px-1">~/.claude/skills/types-de-lmasc/SKILL.md</code></li>
          <li><strong>Module data</strong> : <code className="rounded bg-neutral-100 px-1">svlbh-pro/shared/data/typesDE_Lmasc.js</code></li>
        </ol>
      </section>

      {/* 3. Structure de données */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">3. Structure de données</h3>

        <h4 className="mb-1 mt-3 text-sm font-bold text-blue-900">3.1 Organes ciblés</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="border border-blue-200 px-2 py-1 text-left">Organe</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Abbr</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Élément</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Émotion</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Rôle Lmasc</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-blue-200 px-2 py-1">Reins</td>
                <td className="border border-blue-200 px-2 py-1 font-mono">KI</td>
                <td className="border border-blue-200 px-2 py-1">Eau 水</td>
                <td className="border border-blue-200 px-2 py-1">Peur</td>
                <td className="border border-blue-200 px-2 py-1">Récepteur direct de l&apos;héritage paternel ; stocke le Jing ancestral</td>
              </tr>
              <tr>
                <td className="border border-blue-200 px-2 py-1">Foie</td>
                <td className="border border-blue-200 px-2 py-1 font-mono">LR</td>
                <td className="border border-blue-200 px-2 py-1">Bois 木</td>
                <td className="border border-blue-200 px-2 py-1">Colère</td>
                <td className="border border-blue-200 px-2 py-1">Stagnation du Qi hérité ; le Hun porte les mémoires des ancêtres masculins</td>
              </tr>
              <tr>
                <td className="border border-blue-200 px-2 py-1">Rate</td>
                <td className="border border-blue-200 px-2 py-1 font-mono">SP</td>
                <td className="border border-blue-200 px-2 py-1">Terre 土</td>
                <td className="border border-blue-200 px-2 py-1">Rumination</td>
                <td className="border border-blue-200 px-2 py-1">Transformation des informations pathologiques héritées ; Yi affaibli</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 className="mb-1 mt-4 text-sm font-bold text-blue-900">3.2 Schéma par type de DE (36 entrées)</h4>
        <p className="text-xs italic text-neutral-600">
          Chaque fiche regroupe : identité (organe / typeId / nom FR-ZH) — conflits sur 4 couches
          (Hamer biologique × Sabbah ressenti × Sephiroth/pilier × Lmasc transmission) — MTC (méridiens,
          points-clés, Zi Wu Liu Zhu) — hDOM (dimension Phantom D1-D11, chakras, seuils SLA/SLSA/SLPMO/SLM,
          Gu node, porte d&apos;entrée Phantom) — Rose des Vents (azimut, plan, points porteurs) —
          chromothérapie (color gel, hash biophotonique) — signes physiques (somatiques, latéralité,
          temporalité, inspection MTC teint/langue/pouls/odeur) — signes psychiques — protocole
          (libération, solide platonique, affirmation, durée) — notes cliniques Patrick.
        </p>

        <h4 className="mb-1 mt-4 text-sm font-bold text-blue-900">3.3 Croisements avec les autres skills</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="border border-blue-200 px-2 py-1 text-left">Champ</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Skill source</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Clé de jointure</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">conflit_sephiroth.monde</td><td className="border border-blue-200 px-2 py-1">sephiroth-checkup</td><td className="border border-blue-200 px-2 py-1">Monde 1–10</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">dimension_phantom</td><td className="border border-blue-200 px-2 py-1">phantom-matrix-parasites</td><td className="border border-blue-200 px-2 py-1">Niveau D1–D11</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">porte_entree_phantom</td><td className="border border-blue-200 px-2 py-1">phantom-matrix-parasites</td><td className="border border-blue-200 px-2 py-1">5 portes principales</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">azimut_rdv + plan_rdv</td><td className="border border-blue-200 px-2 py-1">rose-des-vents-hara</td><td className="border border-blue-200 px-2 py-1">16 directions × 3 plans</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">score_seuil</td><td className="border border-blue-200 px-2 py-1">hdom-decoder</td><td className="border border-blue-200 px-2 py-1">Seuils SLA/SLSA/SLPMO/SLM</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">gu_node</td><td className="border border-blue-200 px-2 py-1">hdom-decoder</td><td className="border border-blue-200 px-2 py-1">Nœuds Gu 鬼 sur 9D × 33 chakras</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">conflit_lmasc.transmission</td><td className="border border-blue-200 px-2 py-1">vibration-originelle-</td><td className="border border-blue-200 px-2 py-1">Canal père→fils</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">protocole_liberation</td><td className="border border-blue-200 px-2 py-1">myshamanfamily</td><td className="border border-blue-200 px-2 py-1">Sessions S1–S7</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">couleur_gel</td><td className="border border-blue-200 px-2 py-1">hdom-decoder</td><td className="border border-blue-200 px-2 py-1">Color Gels par méridien</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">points_acupressure_rdv</td><td className="border border-blue-200 px-2 py-1">rose-des-vents-hara</td><td className="border border-blue-200 px-2 py-1">roseDesVentsDirs.js — points par azimut</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1 font-mono">meridiens_impliques</td><td className="border border-blue-200 px-2 py-1">shared/data</td><td className="border border-blue-200 px-2 py-1">mtcMeridiens.js — 20 méridiens</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Sources */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">4. Sources</h3>
        <h4 className="mb-1 mt-2 text-sm font-bold text-blue-900">Primaires (Patrick)</h4>
        <ul className="ml-5 list-disc space-y-0.5 text-xs">
          <li>Observations cliniques directes en séance VLBH</li>
          <li>Muscle testing / radiesthésie sur les 36 types</li>
          <li>Corrélations observées entre Lmasc et organes cibles</li>
        </ul>
        <h4 className="mb-1 mt-3 text-sm font-bold text-blue-900">Secondaires (web search Hamer / Sabbah)</h4>
        <ul className="ml-5 list-disc space-y-0.5 text-xs">
          <li>Tables Hamer : conflit biologique ↔ organe ↔ feuillet embryonnaire</li>
          <li>Tables Sabbah : décodage psychosomatique, phrases-clés du ressenti</li>
          <li>Searches dédiés Reins / Foie / Rate</li>
        </ul>
        <h4 className="mb-1 mt-3 text-sm font-bold text-blue-900">Internes (skills VLBH)</h4>
        <ul className="ml-5 list-disc space-y-0.5 text-xs">
          <li>hdom-decoder, sephiroth-checkup, phantom-matrix-parasites</li>
          <li>rose-des-vents-hara, vibration-originelle-, myshamanfamily</li>
          <li>endometriose-ferritine (patterns Rate/Foie croisés)</li>
          <li>svlbh-pro/shared/data/mtcMeridiens.js + roseDesVentsDirs.js</li>
        </ul>
      </section>

      {/* 5. Livrables */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">5. Livrables attendus</h3>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
          <p><strong>A — Skill VLBH</strong> : <code className="rounded bg-white px-1">~/.claude/skills/types-de-lmasc/SKILL.md</code>, YAML frontmatter + markdown, 36 fiches en 3 sections (KI / LR / SP).</p>
          <p className="mt-2"><strong>B — Module data</strong> : <code className="rounded bg-white px-1">svlbh-pro/shared/data/typesDE_Lmasc.js</code>, exports <code>TYPES_DE_KI</code> / <code>TYPES_DE_LR</code> / <code>TYPES_DE_SP</code> / <code>ALL_TYPES_DE_LMASC</code> + lookups <code>typeDeById</code> + <code>typeDeByOrgane</code>, plus barrel <code>shared/data/index.js</code> mis à jour.</p>
        </div>
      </section>

      {/* 6. Workflow */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">6. Workflow Claude terminal — 4 phases</h3>
        <ol className="ml-5 list-decimal space-y-1 text-xs">
          <li><strong>Phase 1 — Préparation autonome</strong> : lire 6 skills sources + web search Hamer/Sabbah + scaffold JS 36 entrées vides.</li>
          <li><strong>Phase 2 — Co-construction avec Patrick</strong> : organe par organe, type par type. Patrick donne nom + clinique → Claude propose Hamer/Sabbah → Patrick confirme par radiesthésie → Claude remplit croisements hDOM/Sephiroth/RdV → Patrick valide. Rythme ~4 types par tour.</li>
          <li><strong>Phase 3 — Consolidation autonome</strong> : générer SKILL.md complet, module typesDE_Lmasc.js, barrel index.js, git commit + push.</li>
          <li><strong>Phase 4 — Archivage</strong> : déplacer le handover de <code>active/</code> vers <code>archive/</code>.</li>
        </ol>
      </section>

      {/* 7. Notes */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">7. Notes</h3>
        <ul className="ml-5 list-disc space-y-1 text-xs">
          <li><strong>NODE_ENV</strong> : iMac a <code>NODE_ENV=production</code> dans <code>~/.zshrc</code> → utiliser <code>NODE_ENV=development npm install --include=dev</code>.</li>
          <li><strong>Pas de partial work</strong> : chaque fiche complète avant la suivante. Règle Patrick « no patch, no partial replacement ».</li>
          <li><strong>Divergence reporting</strong> : si Hamer/Sabbah ne colle pas avec l&apos;observation clinique de Patrick, documenter explicitement dans <code>notes_cliniques</code>.</li>
          <li><strong>Anti-shadowban</strong> : vocabulaire VLBH (« accompagnement » plutôt que « traitement », « manifestation » plutôt que « symptôme »).</li>
          <li><strong>Sécurité praticienne</strong> : marqueurs de risque (SLA &lt; 13% = possession, aiguiller vers MyShamanFamily S1 urgence).</li>
          <li><strong>Latéralité Lmasc</strong> : pollution Lmasc se manifeste côté <strong>droit</strong> (masculin/paternel) par défaut. Manifestation côté gauche = croisement avec la Lfem (lignée féminine) → documenter.</li>
          <li><strong>Barrel imports first</strong> : vérifier re-exports existants de <code>shared/data/index.js</code> avant ajout, pour éviter les conflits de noms.</li>
        </ul>
      </section>

      {/* 8. Validation */}
      <section>
        <h3 className="mb-2 text-base font-bold text-blue-950">8. Validation</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="border border-blue-200 px-2 py-1 text-left">Critère</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Validé par</th>
                <th className="border border-blue-200 px-2 py-1 text-left">Méthode</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-blue-200 px-2 py-1">36 fiches complètes (12 × 3 organes)</td><td className="border border-blue-200 px-2 py-1">Patrick</td><td className="border border-blue-200 px-2 py-1">Revue fiche par fiche</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1">Corrélations Hamer/Sabbah cohérentes</td><td className="border border-blue-200 px-2 py-1">Patrick</td><td className="border border-blue-200 px-2 py-1">Radiesthésie + muscle testing</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1">Croisements hDOM/Sephiroth/RdV valides</td><td className="border border-blue-200 px-2 py-1">Patrick</td><td className="border border-blue-200 px-2 py-1">Vérification par skills existants</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1">Skill SKILL.md fonctionnel</td><td className="border border-blue-200 px-2 py-1">Claude terminal</td><td className="border border-blue-200 px-2 py-1">Test de déclenchement</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1">Module JS importable</td><td className="border border-blue-200 px-2 py-1">Claude terminal</td><td className="border border-blue-200 px-2 py-1"><code>import</code> test dans svlbh-pro</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1">Barrel index.js à jour</td><td className="border border-blue-200 px-2 py-1">Claude terminal</td><td className="border border-blue-200 px-2 py-1">Vérification exports</td></tr>
              <tr><td className="border border-blue-200 px-2 py-1">Commit + push propre</td><td className="border border-blue-200 px-2 py-1">Claude terminal</td><td className="border border-blue-200 px-2 py-1"><code>git status</code> clean</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-4 border-t border-neutral-200 pt-2 text-center text-[11px] text-neutral-500">
        © 2026 Patrick Bays — Digital Shaman Lab · vlbh.energy
      </footer>
    </article>
  );
}
