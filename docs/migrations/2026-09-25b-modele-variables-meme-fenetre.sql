-- 2026-09-25 (suite) — v_modele_economique : Supabase + Anthropic sur la MÊME
-- fenêtre que outils_par_mois (mois pleins 2026), en plus de la fenêtre de 3 mois.
--
-- Pourquoi : la page retire ces charges de la part fixe (elles suivent le volume).
-- Soustraire une moyenne sur 3 mois d'une moyenne sur 8 mois mêlerait deux
-- périodes ; on soustrait donc variables_par_mois (8 mois) de charges_fixes, et
-- le coût par apprenante reste variables_par_mois_3m ÷ femmes_payantes_3m (même
-- fenêtre de 3 mois des deux côtés). Colonne AJOUTÉE à la fin, rien ne bouge
-- pour les lecteurs existants.

begin;

create or replace view public.v_modele_economique
with (security_invoker = true) as
 WITH mois_pleins AS (
         SELECT v_mois.mois,
            v_mois.encaisse,
            v_mois.tva_due,
            v_mois.prealable,
            v_mois.charges,
            v_mois.reverse_praticiennes,
            v_mois.prive,
            v_mois.a_qualifier,
            v_mois.reste_activite
           FROM v_mois
          WHERE v_mois.mois < to_char(CURRENT_DATE::timestamp with time zone, 'YYYY-MM'::text)
        ), n_mois AS (
         SELECT count(*)::numeric AS n
           FROM mois_pleins
        ), nat AS (
         SELECT l.ligne_id,
            l.montant,
            l.date_valeur,
            COALESCE(r_1.nature, nature_suggeree(l.texte, l.montant)) AS nature,
            l.texte ILIKE 'supabase%' OR l.texte ILIKE 'anthropic%' OR l.texte ILIKE 'claude.ai%' AS suit_le_volume
           FROM releve_ligne l
             LEFT JOIN rapprochement r_1 ON r_1.ligne_id = l.ligne_id
          WHERE EXTRACT(year FROM l.date_valeur) = 2026::numeric AND to_char(l.date_valeur::timestamp with time zone, 'YYYY-MM'::text) < to_char(CURRENT_DATE::timestamp with time zone, 'YYYY-MM'::text)
        ), charges AS (
         SELECT round(sum(- nat.montant) FILTER (WHERE nat.nature = ANY (ARRAY['charge'::text, 'charge_sans_tva'::text])) / NULLIF(( SELECT n_mois.n
                   FROM n_mois), 0::numeric), 2) AS outils_par_mois,
            round(sum(- nat.montant) FILTER (WHERE nat.nature = 'charge_exploitation'::text) / NULLIF(( SELECT n_mois.n
                   FROM n_mois), 0::numeric), 2) AS exploitation_par_mois,
            round(sum(- nat.montant) FILTER (WHERE nat.nature = 'remuneration_praticienne'::text), 2) AS remuneration_annee,
            round(sum(- nat.montant) FILTER (WHERE nat.suit_le_volume AND nat.nature = ANY (ARRAY['charge'::text, 'charge_sans_tva'::text, 'charge_exploitation'::text])) / NULLIF(( SELECT n_mois.n
                   FROM n_mois), 0::numeric), 2) AS variables_par_mois
           FROM nat
        ), revenus AS (
         SELECT round(avg(mois_pleins.encaisse), 2) AS encaisse_moyen,
            round(avg(mois_pleins.reste_activite), 2) AS reste_moyen,
            count(*) AS mois
           FROM mois_pleins
        ), payantes AS (
         SELECT count(DISTINCT p_1.consultante_id) AS femmes
           FROM payment p_1
          WHERE p_1.paid_at >= (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) - '3 mons'::interval) AND p_1.paid_at < date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)
        ), variables AS (
         -- Les charges qui suivent le volume (DEC Patrick 25.09) : Supabase et
         -- Anthropic, lues sur les libellés bancaires. Pas de filtre d'année :
         -- la fenêtre glissante doit traverser le 1er janvier.
         -- ⚠️ Motifs ANCRÉS au début du libellé : « %claude% » attrapait un
         -- paiement Twint entrant dont le libellé porte un prénom (mesuré le 25.09).
         SELECT round(sum(- l.montant) / 3::numeric, 2) AS par_mois
           FROM releve_ligne l
             LEFT JOIN rapprochement r_2 ON r_2.ligne_id = l.ligne_id
          WHERE l.date_valeur >= (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) - '3 mons'::interval)
            AND l.date_valeur < date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)
            AND COALESCE(r_2.nature, nature_suggeree(l.texte, l.montant)) = ANY (ARRAY['charge'::text, 'charge_sans_tva'::text, 'charge_exploitation'::text])
            AND (l.texte ILIKE 'supabase%' OR l.texte ILIKE 'anthropic%' OR l.texte ILIKE 'claude.ai%')
        )
 SELECT c.outils_par_mois,
    c.exploitation_par_mois,
    c.outils_par_mois + c.exploitation_par_mois AS charges_fixes,
    c.remuneration_annee,
    r.encaisse_moyen,
    r.reste_moyen,
    r.mois,
    p.femmes AS femmes_payantes_3m,
    COALESCE(v.par_mois, 0::numeric) AS variables_par_mois_3m,
    COALESCE(c.variables_par_mois, 0::numeric) AS variables_par_mois
   FROM charges c,
    revenus r,
    payantes p,
    variables v
  WHERE ( SELECT is_owner_st6() AS is_owner_st6);

commit;
