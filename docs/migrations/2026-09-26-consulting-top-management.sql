-- 2026-09-26 — La journée de consulting top management.
-- Patrick, 26.09.2026, mot pour mot : « sur cockput.svlbh.com/modele la journee de
-- consulting top management est à CHF 20000, paquet de 3 jours dans l'année »
-- Ajoutée EN PLUS des journées de consulting à 1 997 (lecture à confirmer).
-- Modèle v0.9.13 (append-only) + product_catalog (« le catalogue suit la simulation »).

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, note)
values ('v0.9.13', '2026-09-26', 'patrick',
  '{"base": "v0.9.12",
    "consulting_top_management": {"nom": "Journées de consulting top management", "prix_jour": 20000,
      "jours_par_paquet": 3, "paquet": "3 jours dans l''année"}}'::jsonb,
  'Patrick, 26.09 : « la journee de consulting top management est à CHF 20000, paquet de 3 jours dans l''année ».');

insert into public.product_catalog (code, label, kind, price_ttc, vat_rate, vat_treatment, active, sort_order, notes)
values ('CONSULTING_TOP_MANAGEMENT_JOUR', 'Journées de consulting top management (paquet de 3 jours dans l''année)',
  'autre', 20000.00, 8.10, 'STANDARD', true, 56,
  'DEC Patrick 26.09 : 20 000 la journée, paquet de 3 jours dans l''année.');

commit;
