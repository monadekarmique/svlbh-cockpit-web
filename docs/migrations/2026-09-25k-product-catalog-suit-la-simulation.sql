-- 2026-09-25 — product_catalog suit la simulation du point de bascule.
--
-- Patrick, 25.09.2026 : « ça c'est le product catalogue » → choix « Le catalogue suit
-- la simulation » ; liste de 15 lignes montrée avant écriture ; « rajoute livres priv1
-- et livres chroma » ; « 9.80 pièces » ; « Le Forfait z2 - accès aux app priv, le
-- forfait z3 est l'accès aux app chroma priv 1 et priv 2 ».
--
-- AJOUTS seulement, plus 3 DÉSACTIVATIONS (réversibles : active = true). Rien n'est
-- supprimé. Les abonnements en cours portent leur propre prix (consultante_subscription
-- .price_chf, praticienne_abo.amount_chf) : ils ne bougent pas.
-- ⚠️ À confirmer par Patrick : TVA des livres (2,6 %, taux réduit) et de la
--    constellation (STANDARD 8,1 %, comme ses prestations propres).

begin;

insert into public.product_catalog (code, label, kind, price_ttc, vat_rate, vat_treatment, active, sort_order, notes) values
 ('DECOUVERTE_Z1', 'Programme découverte z1', 'animation', 159.00, 8.10, 'STANDARD', true, 31,
  'DEC Patrick 25.09 : 159 par participante, 5 × 4 heures dans la semaine ; l''animateur encaisse jusqu''à 9 × 159 et reverse 1 × 159 à Patrick.'),
 ('ABO_MYSHAMAN_SUPERVISION', 'myShaman — supervision active du mentor (5 mois)', 'abo', 179.00, 8.10, 'STANDARD', true, 45,
  'DEC Patrick 25.09 : 179 par mois pendant 5 mois de supervision active. Remplace ABO_MYSHAMAN_9M.'),
 ('ABO_MYSHAMAN_CONSOLIDATION', 'myShaman — consolidation, sans supervision globale (4 à 8 mois)', 'abo', 59.00, 8.10, 'STANDARD', true, 46,
  'DEC Patrick 25.09 : 59 par mois, 4 à 8 mois de consolidation.'),
 ('ABO_MYSHAMANFAMILY_SUPERVISION', 'myShaman Family — supervision active du mentor (5 mois)', 'abo', 179.00, 8.10, 'STANDARD', true, 47,
  'DEC Patrick 25.09 : 179 par mois pendant 5 mois. Remplace ABO_MYSHAMANFAMILY_15M.'),
 ('MYSHAMANFAMILY_CONSTELLATION', 'MyShamanFamily Constellation 2 heures et demie', 'soin', 299.00, 8.10, 'STANDARD', true, 48,
  'DEC Patrick 25.09 : remplace la consolidation myShaman Family. TVA STANDARD à confirmer.'),
 ('ABO_ACCELERATION_MYSHAMANFAMILY', 'Accélération myShamanFamily', 'abo', 199.00, 8.10, 'STANDARD', true, 49,
  'DEC Patrick 25.09 : 199. Remplace ABO_ACCELERATION_4S (179).'),
 ('ABO_ACCELERATION_MYSHAMAN_FAMILY', 'Accélération myShaman - myShamanFamily (forfait de deux mois)', 'abo', 599.00, 8.10, 'STANDARD', true, 50,
  'DEC Patrick 25.09 : forfait de deux mois.'),
 ('ABO_Z2_ACCES_PRIV', 'Forfait z2 — accès aux apps Priv', 'abo', 59.00, 8.10, 'STANDARD', true, 43,
  'DEC Patrick 25.09 : le forfait z2 est l''accès aux apps Priv (barème canal z2 : 59).'),
 ('ABO_Z3_ACCES_CHROMA_PRIV', 'Forfait z3 — accès aux apps Chroma, Priv 1 et Priv 2', 'abo', 79.00, 8.10, 'STANDARD', true, 44,
  'DEC Patrick 25.09 : le forfait z3 est l''accès aux apps Chroma, Priv 1 et Priv 2 (barème canal z3 : 79).'),
 ('CONSULTING_JOUR', 'Journées de consulting (paquet de 5 jours sur 14 jours)', 'autre', 1997.00, 8.10, 'STANDARD', true, 55,
  'DEC Patrick 25.09 : 1 997 la journée, par paquet de 5 jours sur 14 jours.'),
 ('FORM_VIBRATION_THERAPEUTE', 'Programme je découvre ma Vibration de thérapeute (6 mois)', 'formation', 359.00, 8.10, 'STANDARD', true, 67,
  'DEC Patrick 25.09 : 359 × 6 mois, possible en option avec myShaman Family.'),
 ('FORM_VIBRATION_FEMME_RELATION', 'Programme je découvre ma Vibration de femme en relation (forfait de deux mois)', 'formation', 599.00, 8.10, 'STANDARD', true, 68,
  'DEC Patrick 25.09 : 599, forfait de deux mois.'),
 ('LIVRES_PRIV1', 'Livres Priv1', 'autre', 9.80, 2.60, 'STANDARD', true, 90,
  'DEC Patrick 25.09 : 9.80 la pièce. TVA taux réduit livres (2,6 %) à confirmer.'),
 ('LIVRES_CHROMA', 'Livres Chroma', 'autre', 9.80, 2.60, 'STANDARD', true, 91,
  'DEC Patrick 25.09 : 9.80 la pièce. TVA taux réduit livres (2,6 %) à confirmer.');

update public.product_catalog
   set active = false,
       notes = coalesce(notes, '') || ' — DÉSACTIVÉ 25.09.2026 (DEC Patrick « le catalogue suit la simulation ») : remplacé par ' ||
               case code when 'ABO_MYSHAMAN_9M' then 'ABO_MYSHAMAN_SUPERVISION + ABO_MYSHAMAN_CONSOLIDATION'
                         when 'ABO_MYSHAMANFAMILY_15M' then 'ABO_MYSHAMANFAMILY_SUPERVISION'
                         when 'ABO_ACCELERATION_4S' then 'ABO_ACCELERATION_MYSHAMANFAMILY' end || '. Réactivable.'
 where code in ('ABO_MYSHAMAN_9M', 'ABO_MYSHAMANFAMILY_15M', 'ABO_ACCELERATION_4S');

commit;
