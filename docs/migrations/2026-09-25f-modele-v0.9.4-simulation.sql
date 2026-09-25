-- 2026-09-25 — Modèle v0.9.4 : le point de bascule devient une simulation.
--
-- Patrick, 25.09.2026, mot pour mot :
--   « au lieu de il faut je veux pouvoir jouer avec pour obtenir un total en bas -
--     par exemple My Shaman supervision , 15 mais je peux changer manuellement cette
--     valeur et qui me caclule le chiffre d'affaire TTC , la même chose pour achque
--     ligne , MyShamanFamily consolidation vaut CHF 79, on peut supprimer monitoring
--     ST2 et Soin 3 Âmes avec don CHF vient en premier , accéléation 1 mois devient
--     accélération mySHamanFamily CHF 199 avec valeur 12 »
--
-- Delta sur v0.9.3 (append-only).

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.4', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.3 — la consolidation myShaman Family, l'accélération myShamanFamily et la simulation (25.09)",
    "myshamanfamily": { "consolidation_mois": 79 },
    "acceleration_myshamanfamily": { "nom": "Accélération myShamanFamily", "prix_mois": 199 },
    "point_de_bascule": {
      "forme": "simulation : une quantité modifiable par ligne, le chiffre d'affaires TTC par ligne et un total en bas",
      "en_premier": "Soin 3 Âmes et + (avec don de soutien)",
      "retire": "Monitoring ST2",
      "remplace": "« Accélération, 1 mois » devient « Accélération myShamanFamily »",
      "quantites_par_defaut": { "myshaman_supervision_active": 15, "acceleration_myshamanfamily": 12 }
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.4 :

1. LES QUANTITÉS PAR DÉFAUT des autres lignes ne sont pas dites : elles partent de 0.

2. HT CONTRE TTC : le total est un chiffre d'affaires TTC ; les 452 d'une formatrice sont HT. L'écart en bas de la simulation compare donc du TTC (avant TVA due) à des charges.

3. COMBIEN DE FORMATRICES : saisissable dans la simulation, 0 par défaut.

4. La facturation (product_catalog) n'a toujours pas bougé ; l'accélération myShamanFamily à 199 n'y existe pas.$txt$,
  $txt$=== v0.9.4 — LA SIMULATION (DEC Patrick 25.09.2026) ===

Au lieu de « il en faut », chaque ligne porte une quantité que Patrick change à la main ; la page calcule le chiffre d'affaires TTC de chaque ligne et le total. myShaman supervision part de 15, l'accélération myShamanFamily (199 CHF) de 12. La consolidation myShaman Family vaut 79 CHF. Monitoring ST2 sort ; le Soin 3 Âmes et + (avec don de soutien) passe en premier.$txt$
);

commit;
