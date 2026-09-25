-- 2026-09-25 — Modèle v0.9.5 : la simulation est annuelle, scénario « Patrick seul ».
--
-- Patrick, 25.09.2026, mot pour mot :
--   « cette version 0.9.4 c'est si je suis tout seul et le chiffre d'affaire est
--     annuel . on va ajouter une accélération myShaman - myShamanFamily à CHF 599 et
--     un Programme je découvre ma vibration de femme en relation CHF 599 »
--
-- Delta sur v0.9.4 (append-only).
-- Lecture appliquée (à corriger par Patrick si elle est fausse) : les quantités sont
-- des volumes SUR L'ANNÉE ; le chiffre d'affaires d'une ligne = prix × paiements par
-- personne × quantité ; il se compare à ce qu'il faut couvrir sur l'année.

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.5', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.4 — la simulation devient annuelle, scénario « Patrick seul », deux lignes à 599 (25.09)",
    "point_de_bascule": {
      "scenario": "Patrick seul",
      "chiffre_affaires": "annuel",
      "quantites": "volumes sur l'année"
    },
    "acceleration_myshaman_myshamanfamily": { "nom": "Accélération myShaman - myShamanFamily", "prix": 599 },
    "vibration_femme_relation": { "nom": "Programme je découvre ma vibration de femme en relation", "prix": 599 }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.5 :

1. LA LECTURE « ANNUEL » : quantités = volumes sur l'année, chiffre d'affaires = prix × paiements par personne × quantité. Si Patrick voulait dire « le mensuel × 12 », la simulation est à refaire.

2. LES DURÉES EN FOURCHETTE (« 4 à 8 mois », « 3 à 4 mois ») sont comptées à leur borne basse ; modifiables dans la simulation.

3. LES DEUX LIGNES À 599 n'ont pas de durée dite : un seul paiement, modifiable.

4. LE SCÉNARIO AVEC FORMATRICES n'est pas encore décrit : « Patrick seul » = 0 formatrice.

5. Ouverts de v0.9.4 : HT contre TTC, facturation (product_catalog) inchangée.$txt$,
  $txt$=== v0.9.5 — L'ANNÉE, PATRICK SEUL (DEC Patrick 25.09.2026) ===

La simulation de v0.9.4 est le scénario « Patrick seul », et son chiffre d'affaires est annuel. Deux lignes entrent : Accélération myShaman - myShamanFamily (599 CHF) et Programme je découvre ma vibration de femme en relation (599 CHF).$txt$
);

commit;
