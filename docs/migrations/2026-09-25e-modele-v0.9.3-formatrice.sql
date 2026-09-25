-- 2026-09-25 — Modèle v0.9.3 : ce que coûte une formatrice.
--
-- Patrick, 25.09.2026, mot pour mot :
--   « une formatrice me coute CHF 452 HT  par mois en supervision non facturable »
--
-- Delta sur v0.9.2 (append-only). Le NOMBRE de formatrices n'est pas dit : la page
-- n'ajoute pas ce coût au total, elle montre ce que CHAQUE formatrice demande en
-- plus, tarif par tarif.

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.3', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.2 — seul le coût d'une formatrice entre (25.09)",
    "charges_patrick": {
      "formatrice_supervision_mois_ht": 452,
      "formatrice": "une formatrice coûte 452 CHF HT par mois en supervision non facturable (DEC Patrick 25.09)"
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.3 :

1. COMBIEN DE FORMATRICES : non dit. Le coût (452 HT/mois chacune) n'est donc pas dans le total à couvrir ; la page montre ce que chacune demande en plus.

2. HT CONTRE TTC : les 452 sont HT ; les prix du point de bascule (179, 59, 359, 159…) sont lus tels quels, sans retirer la TVA due (8,1 %, méthode effective). Si ce sont des prix TTC, chaque versement rapporte 1/1,081 de son prix, et il en faut un peu plus.

3. Tout ce qui restait ouvert dans v0.9.2 (caisse maladie et électricité en plus ou sur le salaire, charges sociales d'un salaire net, prix de la consolidation myShaman Family, facturation inchangée).$txt$,
  $txt$=== v0.9.3 — LA FORMATRICE (DEC Patrick 25.09.2026) ===

Une formatrice coûte 452 CHF HT par mois en supervision non facturable. Le point de bascule dit, pour chaque tarif, combien de versements en plus couvrent une formatrice.$txt$
);

commit;
