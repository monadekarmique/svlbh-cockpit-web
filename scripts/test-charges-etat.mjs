// Test de l'état d'une ligne de /charges (carte 44551562). `node --test scripts/test-charges-etat.mjs` (Node 24 lit le .ts).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { etatLigne, CLASSES_ETAT, POSE_PAR_APPRIS } from "../src/lib/charges-etat.ts";

test("trois états : proposé, appris, validé", () => {
  assert.equal(etatLigne(null, false), "propose");
  assert.equal(etatLigne("charge", false), "valide");
  assert.equal(etatLigne("charge", true), "appris");
  // Rien d'écrit = proposé, quoi que dise le drapeau : une ligne sans annotation ne peut pas être apprise.
  assert.equal(etatLigne(null, true), "propose");
});

test("les trois états ne se ressemblent pas à l'écran", () => {
  const classes = Object.values(CLASSES_ETAT);
  assert.equal(new Set(classes).size, 3);
  assert.match(CLASSES_ETAT.valide, /emerald/);
  assert.match(CLASSES_ETAT.appris, /sky/);
  assert.match(CLASSES_ETAT.propose, /italic/);
  assert.doesNotMatch(CLASSES_ETAT.appris, /emerald/); // l'appris n'est jamais vert
});

test("la signature apprise est celle de la base", () => {
  assert.equal(POSE_PAR_APPRIS, "fable-appris");
});

test("la page lit qui a posé l'annotation et le passe au menu", () => {
  const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");
  const page = lire("src/app/(app)/charges/page.tsx");
  assert.match(page, /\.from\("rapprochement"\)\s*\.select\("ligne_id"\)\s*\.eq\("pose_par", POSE_PAR_APPRIS\)/);
  assert.match(page, /appris=\{appris\.has\(l\.ligne_id\)\}/);
  const menu = lire("src/app/(app)/charges/nature-select.tsx");
  assert.match(menu, /CLASSES_ETAT\[etatLigne\(valeur, signeFable\)\]/);
});
