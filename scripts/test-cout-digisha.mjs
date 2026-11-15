// Témoin de la ligne de coût DiGiSha. `node --test scripts/test-cout-digisha.mjs` (Node 24 lit le .ts).
// Patrick, 11.11.2026 : « sur tous les DigiSha nous allons brancher cela » (carte 91c366cd). La ligne est la même, au
// caractère près, sur Priv web, Pro web et le cockpit — et elle est absente dès que la base ne l'ouvre pas.
import test from "node:test";
import assert from "node:assert/strict";
import { ligneCoutDigisha, montant } from "../src/lib/cout-digisha.ts";

// une réponse de mon_cout_digisha() pour une personne ST3+ (forme lue dans la définition de la rpc, 15.11.2026)
const reponse = (jourUsd, jourChf, moisUsd, moisChf, plus = {}) => ({
  ouvert: true, vu_comme: false,
  jour: { appels: 3, usd: jourUsd, chf: jourChf },
  mois: { appels: 14, usd: moisUsd, chf: moisChf },
  taux_usd_chf: 0.82067, taux_releve_le: "2026-11-10",
  ...plus,
});

test("la ligne de la carte, au caractère près", () => {
  const ligne = ligneCoutDigisha(reponse(5.11, 4.19, 9.06, 7.43));
  assert.equal(ligne, "Aujourd'hui 5,11 $ · 4,19 CHF — ce mois 9,06 $ · 7,43 CHF");
  // apostrophe droite, point médian, tiret cadratin, espaces ordinaires : ceux de la carte
  assert.equal(ligne.includes("'"), true);
  assert.equal(ligne.split("·").length, 3);
  assert.equal(ligne.split("—").length, 2);
  assert.equal(/[.   ]/.test(ligne), false);
});

test("zéro : la ligne s'écrit, avec 0,00", () => {
  assert.equal(montant(0), "0,00");
  assert.equal(montant(-0), "0,00");
  assert.equal(ligneCoutDigisha(reponse(0, 0, 0, 0)), "Aujourd'hui 0,00 $ · 0,00 CHF — ce mois 0,00 $ · 0,00 CHF");
  // tel que la base l'envoie un jour sans appel (les numériques de jsonb gardent leurs zéros)
  const brut = '{"ouvert":true,"vu_comme":false,"jour":{"appels":0,"usd":0.00,"chf":0.00},' +
    '"mois":{"appels":14,"usd":9.06,"chf":7.43},"taux_usd_chf":0.82067,"taux_releve_le":"2026-11-10"}';
  assert.equal(ligneCoutDigisha(JSON.parse(brut)), "Aujourd'hui 0,00 $ · 0,00 CHF — ce mois 9,06 $ · 7,43 CHF");
});

test("arrondi : toujours deux décimales, virgule décimale", () => {
  assert.equal(montant(5.114), "5,11");
  assert.equal(montant(5.116), "5,12");
  assert.equal(montant(0.999), "1,00");
  assert.equal(montant(0.004), "0,00");
  assert.equal(montant(2), "2,00");
  assert.equal(montant(2.5), "2,50");
  assert.equal(montant(9.06), "9,06");
  assert.equal(ligneCoutDigisha(reponse(0.999, 0.816, 12.3, 10.094)), "Aujourd'hui 1,00 $ · 0,82 CHF — ce mois 12,30 $ · 10,09 CHF");
});

test("grand nombre : pas de séparateur de milliers, une seule virgule", () => {
  assert.equal(montant(1234.5), "1234,50");
  assert.equal(montant(1234567.891), "1234567,89");
  assert.equal(ligneCoutDigisha(reponse(1234.5, 1013.12, 1234567.891, 1013170.86)),
    "Aujourd'hui 1234,50 $ · 1013,12 CHF — ce mois 1234567,89 $ · 1013170,86 CHF");
});

test("ouvert faux (sous ST3) : rien", () => {
  assert.equal(ligneCoutDigisha({ ouvert: false }), null);
  // même si des chiffres traînaient dans la réponse, la porte fermée l'emporte
  assert.equal(ligneCoutDigisha(reponse(5.11, 4.19, 9.06, 7.43, { ouvert: false })), null);
  // « ouvert » doit être le booléen vrai, pas quelque chose qui y ressemble
  for (const ouvert of [undefined, null, "true", 1, "oui"]) {
    assert.equal(ligneCoutDigisha(reponse(5.11, 4.19, 9.06, 7.43, { ouvert })), null);
  }
});

test("réponse nulle (aucune identité, rpc en échec, pas de session) : rien", () => {
  for (const v of [null, undefined, "", "erreur", 0, 12, true, false, [], {}]) {
    assert.equal(ligneCoutDigisha(v), null);
  }
});

test("un montant manquant ou qui n'est pas un nombre : rien, plutôt qu'une ligne à trous", () => {
  // aucun taux relevé : la base rend chf nul
  assert.equal(ligneCoutDigisha(reponse(5.11, null, 9.06, null)), null);
  assert.equal(ligneCoutDigisha(reponse(5.11, 4.19, 9.06, null)), null);
  assert.equal(ligneCoutDigisha(reponse(undefined, 4.19, 9.06, 7.43)), null);
  assert.equal(ligneCoutDigisha(reponse("5.11", 4.19, 9.06, 7.43)), null);
  assert.equal(ligneCoutDigisha(reponse(Number.NaN, 4.19, 9.06, 7.43)), null);
  assert.equal(ligneCoutDigisha(reponse(5.11, 4.19, Number.POSITIVE_INFINITY, 7.43)), null);
  assert.equal(ligneCoutDigisha({ ouvert: true }), null);
  assert.equal(ligneCoutDigisha({ ouvert: true, jour: { appels: 1, usd: 5.11, chf: 4.19 } }), null);
  assert.equal(ligneCoutDigisha({ ouvert: true, jour: null, mois: null }), null);
});

test("en « voir comme » : la même ligne, avec les chiffres de la personne observée", () => {
  assert.equal(ligneCoutDigisha(reponse(5.11, 4.19, 9.06, 7.43, { vu_comme: true })),
    "Aujourd'hui 5,11 $ · 4,19 CHF — ce mois 9,06 $ · 7,43 CHF");
});
