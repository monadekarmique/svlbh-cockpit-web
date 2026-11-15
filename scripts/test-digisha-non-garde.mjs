// Test du signal « ce tour n'a pas été gardé » (carte ac79ce6b). `node --test scripts/test-digisha-non-garde.mjs`
// (Node 24 lit le .ts). Le serveur écrit la phrase ; le site la transmet et l'affiche telle quelle.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { phraseNonGarde, NON_GARDE_SANS_MOTIF } from "../src/lib/digisha-non-garde.ts";

const PHRASE = "Ce tour n'a pas été gardé : l'enregistrement sur cette fiche a été refusé.";

test("un tour gardé ne dit rien", () => {
  assert.equal(phraseNonGarde({ reply: "R" }), null);
  assert.equal(phraseNonGarde({ reply: "R", non_garde: false, non_garde_motif: null }), null);
  // Un motif sans le drapeau ne suffit pas : c'est `non_garde` qui décide.
  assert.equal(phraseNonGarde({ reply: "R", non_garde_motif: PHRASE }), null);
});

test("un tour non gardé rend la phrase du serveur, telle quelle", () => {
  assert.equal(phraseNonGarde({ reply: "R", non_garde: true, non_garde_motif: PHRASE }), PHRASE);
  assert.equal(phraseNonGarde({ non_garde: true, non_garde_motif: `  ${PHRASE}  ` }), PHRASE);
});

test("non gardé sans motif : le fait seul, aucune raison inventée", () => {
  assert.equal(phraseNonGarde({ non_garde: true }), NON_GARDE_SANS_MOTIF);
  assert.equal(phraseNonGarde({ non_garde: true, non_garde_motif: null }), NON_GARDE_SANS_MOTIF);
  assert.equal(phraseNonGarde({ non_garde: true, non_garde_motif: "   " }), NON_GARDE_SANS_MOTIF);
  assert.equal(phraseNonGarde({ non_garde: true, non_garde_motif: 42 }), NON_GARDE_SANS_MOTIF);
});

test("seul le booléen vrai compte ; une réponse illisible ne dit rien", () => {
  for (const v of ["true", 1, "oui", {}, []]) assert.equal(phraseNonGarde({ non_garde: v, non_garde_motif: PHRASE }), null);
  for (const v of [null, undefined, "", 0, "texte"]) assert.equal(phraseNonGarde(v), null);
});

// Le champ doit traverser l'action et arriver à l'écran : sans ces lectures, le serveur parle dans le vide (c'est l'état
// d'avant le 15.11 : dialoguerDigisha ne rendait que la réponse).
test("l'action et l'écran de /pathologies-entites lisent le signal par ce module", () => {
  const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
  const action = lire("src/app/(app)/pathologies-entites/actions.ts");
  assert.match(action, /nonGarde: phraseNonGarde\(data\)/, "l'action dialoguerDigisha ne rend pas le signal");
  const ecran = lire("src/app/(app)/pathologies-entites/digisha-client.tsx");
  assert.equal((ecran.match(/setNonGarde\(r\.nonGarde \?\? null\)/g) ?? []).length, 2, "définition et dialogue doivent le lire");
  assert.match(ecran, /\{nonGarde && </, "l'écran n'affiche pas la phrase");
});
