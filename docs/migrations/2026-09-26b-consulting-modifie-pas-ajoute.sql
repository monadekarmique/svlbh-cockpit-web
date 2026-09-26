-- 2026-09-26 — Le consulting existant DEVIENT le consulting top management.
-- Patrick, 26.09 : « non modifie l'ancien consulating » — ma migration précédente
-- (2026-09-26-consulting-top-management.sql) l'avait AJOUTÉ à côté. Corrigé :
--   · product_catalog : la ligne ajoutée par erreur (CONSULTING_TOP_MANAGEMENT_JOUR,
--     créée une minute plus tôt, référencée nulle part) est retirée ; CONSULTING_JOUR
--     prend le libellé et le prix de Patrick.
--   · modele_version v0.9.14 : « consulting » porte le top management ; v0.9.13
--     (ligne séparée) est abandonnée — append-only, on ne la réécrit pas.

begin;

delete from public.product_catalog
 where code = 'CONSULTING_TOP_MANAGEMENT_JOUR' and created_at > now() - interval '1 hour';

update public.product_catalog
   set label = 'Journées de consulting top management (paquet de 3 jours dans l''année)',
       price_ttc = 20000.00,
       notes = 'DEC Patrick 26.09 : la journée de consulting top management est à 20 000, paquet de 3 jours dans l''année (était 1 997, paquet de 5 jours sur 14 jours, DEC 25.09).'
 where code = 'CONSULTING_JOUR';

insert into public.modele_version (version, fige_le, fige_par, parametres, note)
values ('v0.9.14', '2026-09-26', 'patrick',
  '{"base": "v0.9.13 — la ligne séparée de v0.9.13 est abandonnée",
    "consulting": {"nom": "Journées de consulting top management", "prix_jour": 20000,
      "jours_par_paquet": 3, "paquet": "3 jours dans l''année"}}'::jsonb,
  'Patrick, 26.09 : « non modifie l''ancien consulating ».');

commit;
