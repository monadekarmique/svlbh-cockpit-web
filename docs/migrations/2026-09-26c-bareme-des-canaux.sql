-- 2026-09-26 — Le barème des canaux, DEC Patrick 26.09, mot pour mot :
--   « dans les barèmes des canaux : z1 Mode à l'unité remplacé par Programme découverte
--     5 jours base inchangée 1x 159 z2 Programme myShaman forfait mensuel , tout ok, on
--     rajoute lancement z+1 CHF 259 , z3 Programme MyShamanFamily - forfait 9 mois
--     (minimum 5x accélération, 3x base , 1x accélération+ lancement 359, z4 en % du
--     Chiffre d'affaire z1 base 0,15%, accélération 0% lancement 0% z4 est le tarif
--     praticienne établie »
--
-- Seul lecteur de canal_abo_bareme : la vue v_bareme, lue par cockpit /modele (mesuré
-- 26.09 : pg_depend + grep des dépôts). Aucune facturation ne s'en sert.
-- Valeurs d'avant (fixées le 09.09) : z2 lancement vide ; z3 lancement 259 ;
-- z4 3 % / 1,5 % / 0,75 %. Elles restent lisibles dans modele_version v0.8.5.

begin;

update public.canal_abo_bareme set montant_lancement_chf = 259, fixe_le = now(), fixe_par = 'patrick' where canal = 'z2';
update public.canal_abo_bareme set montant_lancement_chf = 359, fixe_le = now(), fixe_par = 'patrick' where canal = 'z3';
update public.canal_abo_bareme set taux_pct = 0.15, taux_acceleration_pct = 0, taux_lancement_pct = 0,
       fixe_le = now(), fixe_par = 'patrick' where canal = 'z4';

insert into public.modele_version (version, fige_le, fige_par, parametres, note)
values ('v0.9.15', '2026-09-26', 'patrick',
  $json${
    "base": "v0.9.14",
    "bareme_modes": {
      "z1": "Programme découverte 5 jours",
      "z2": "Programme myShaman — forfait mensuel",
      "z3": "Programme MyShamanFamily — forfait 9 mois (minimum : 5× accélération, 3× base, 1× accélération + lancement)",
      "z4": "% du chiffre d'affaires — tarif praticienne établie"
    },
    "bareme_lancement_note": { "z2": "vers z+1" },
    "bareme": { "z2_lancement": 259, "z3_lancement": 359, "z4_base_pct": 0.15, "z4_acceleration_pct": 0, "z4_lancement_pct": 0 },
    "praticienne_etablie": "z4 est le tarif praticienne établie (DEC Patrick 26.09) — remplace « il n'y a pas de tarif praticienne établie » (09.09)"
  }$json$::jsonb,
  'Patrick, 26.09 : barème des canaux (voir docs/migrations/2026-09-26c-bareme-des-canaux.sql, cité mot pour mot).');

commit;
