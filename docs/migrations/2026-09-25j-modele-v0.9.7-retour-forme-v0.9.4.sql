-- 2026-09-25 — Modèle v0.9.7 : retour à la forme de v0.9.4, persistante.
--
-- Patrick, 25.09.2026, mot pour mot :
--   « revient à l'ancienne version elle m'allait beaucoup mieux , j'avais exactement
--     ce qu'il me fallait - persisgante »
--
-- v0.9.5 avait lu « le chiffre d'affaire est annuel » comme une demande de calcul
-- (prix × paiements par personne × quantité). C'était une DESCRIPTION de v0.9.4.
-- La colonne « paiements » tombe ; la simulation redevient prix × quantité = CA TTC
-- annuel, comparé à ce qu'il faut couvrir sur l'année. Persistante (modele_simulation).

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.7', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.6 — la forme revient à v0.9.4 (25.09)",
    "point_de_bascule": {
      "forme": "prix × quantité = chiffre d'affaires TTC sur l'année, un total en bas, comparé à ce qu'il faut couvrir sur l'année",
      "persistante": "oui — modele_simulation, une ligne par scénario"
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.7 :

1. HT CONTRE TTC : le chiffre d'affaires est TTC, avant la TVA due ; les 452 d'une formatrice sont HT.

2. LE SCÉNARIO AVEC FORMATRICES n'est pas encore décrit (« Patrick seul » = 0 formatrice).

3. La facturation (product_catalog) n'a pas bougé.

Fermé : la lecture « paiements par personne » de v0.9.5 (points 1 à 3 de son bloc ouvert) — Patrick a demandé de revenir à la forme de v0.9.4.$txt$,
  $txt$=== v0.9.7 — RETOUR À LA FORME v0.9.4, PERSISTANTE (DEC Patrick 25.09.2026) ===

« revient à l'ancienne version elle m'allait beaucoup mieux, j'avais exactement ce qu'il me fallait — persistante. » La simulation redevient prix × quantité, avec les lignes ajoutées depuis (deux lignes à 599, consulting à 1 997 la journée), et chaque changement s'enregistre.$txt$
);

commit;
