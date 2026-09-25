-- 2026-09-25 — Modèle v0.9.0 : les charges suivent le nombre d'apprenantes.
--
-- Patrick, 25.09.2026, mot pour mot :
--   « dans le point de bascule, les charges bougent avec les nombre d'apprenantes
--     l'utilisation de supabase va faire croitre les coûts d'infra et de team
--     anthropic, de plus je ne génère actuellement aucune charges sociales, et je
--     ne parviens pas à payer mes 396.25 de caisses maladie. Il existe des frais
--     d'électricité de CHF 100 par mois. le prohgramme découverte devrait me
--     rapporter CHF 159 par semaine et par animateur qui peut gagner jusqu'à 9x
--     CHF 159 pour une animation de 5x 4 heures durant la semaine - il me reverse
--     1x 159 au passage. Le programme découverte z1 est donc CHF 159.- Le Programme
--     myShaman est de CHF 179.- par mois durant les phasees actives de supervision
--     proactive par le mentor, CHF 79 durant les phases de consolidation sans
--     supervision globale du mentor. »
--
-- ① v_modele_economique gagne UNE colonne, à la fin (les lecteurs existants —
--    /modele et /simulateur — lisent les autres par leur nom, rien ne bouge) :
--    variables_par_mois_3m = Supabase + Anthropic relevés en banque sur les trois
--    derniers mois pleins, divisés par 3. Même fenêtre que femmes_payantes_3m,
--    pour que le coût par apprenante soit un rapport sur la même période.
--    Mesuré le 25.09 : juin–août 96,11 (Supabase) + 940,15 (Anthropic) = 1 036,26,
--    soit 345,42 / mois pour 10 femmes qui paient (34,54 par apprenante).
--    ⚠️ Un premier calcul à la main disait 186,09 : son motif « %claude% » comptait
--    des paiements Twint ENTRANTS comme des charges négatives. Faux, corrigé ici.
--
-- ② modele_version v0.9.0, figée (append-only) : ce qui change le 25.09 par
--    rapport à v0.8.5. Rien d'autre n'est reconduit en silence.
--
-- ⚠️ product_catalog N'EST PAS TOUCHÉ : c'est la facturation réelle. Il dit encore
--    myShaman 99 CHF (ABO_MYSHAMAN_9M) ; le modèle dit 179 / 79. Changer ce qu'on
--    facture est un autre geste, que Patrick ordonne séparément.

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
            COALESCE(r_1.nature, nature_suggeree(l.texte, l.montant)) AS nature
           FROM releve_ligne l
             LEFT JOIN rapprochement r_1 ON r_1.ligne_id = l.ligne_id
          WHERE EXTRACT(year FROM l.date_valeur) = 2026::numeric AND to_char(l.date_valeur::timestamp with time zone, 'YYYY-MM'::text) < to_char(CURRENT_DATE::timestamp with time zone, 'YYYY-MM'::text)
        ), charges AS (
         SELECT round(sum(- nat.montant) FILTER (WHERE nat.nature = ANY (ARRAY['charge'::text, 'charge_sans_tva'::text])) / NULLIF(( SELECT n_mois.n
                   FROM n_mois), 0::numeric), 2) AS outils_par_mois,
            round(sum(- nat.montant) FILTER (WHERE nat.nature = 'charge_exploitation'::text) / NULLIF(( SELECT n_mois.n
                   FROM n_mois), 0::numeric), 2) AS exploitation_par_mois,
            round(sum(- nat.montant) FILTER (WHERE nat.nature = 'remuneration_praticienne'::text), 2) AS remuneration_annee
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
    COALESCE(v.par_mois, 0::numeric) AS variables_par_mois_3m
   FROM charges c,
    revenus r,
    payantes p,
    variables v
  WHERE ( SELECT is_owner_st6() AS is_owner_st6);

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.0', '2026-09-25', 'patrick',
  $json${
    "base": "v0.8.5 — seuls les paramètres ci-dessous changent le 25.09 ; le reste de v0.8.5 n'est pas reconduit en silence",
    "bareme": { "z1": 159 },
    "decouverte_z1": {
      "prix_participante": 159,
      "animation": "5 × 4 heures durant la semaine",
      "animateur_jusqu_a": "9 × 159 CHF par animation",
      "reverse_a_patrick": 159,
      "revenu_patrick": "159 CHF par semaine et par animateur"
    },
    "myshaman": {
      "supervision_active_mois": 179,
      "supervision_active": "phases actives de supervision proactive par le mentor",
      "consolidation_mois": 79,
      "consolidation": "phases de consolidation sans supervision globale du mentor"
    },
    "charges_patrick": {
      "variables": "Supabase et Anthropic suivent le nombre d'apprenantes — mesurés en banque (v_modele_economique.variables_par_mois_3m)",
      "charges_sociales_mois": 0,
      "charges_sociales": "aucune générée actuellement",
      "caisse_maladie_mois": 396.25,
      "caisse_maladie": "Patrick ne parvient pas à la payer",
      "electricite_mois": 100
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.0 :

1. LA FACTURATION N'A PAS BOUGÉ. product_catalog dit encore myShaman 99 CHF/mois (ABO_MYSHAMAN_9M, 9 mois) ; le modèle dit 179 en supervision active, 79 en consolidation. Aucune phase n'existe en base pour savoir qui est dans laquelle.

2. LA PENTE « PAR APPRENANTE » EST UN RAPPORT, PAS UNE MESURE PAR PERSONNE : Supabase + Anthropic des 3 derniers mois pleins ÷ femmes qui paient sur la même fenêtre (25.09 : 345,42 ÷ 10 = 34,54 CHF). Anthropic y compte aussi les abonnements Claude de la flotte, pas seulement DiGiSha — c'est la lecture de Patrick (« team anthropic »). Le coût DiGiSha réel par apprenante existe en base (get_digisha_cout_mensuel) et pourra remplacer ce rapport.

3. LE COÛT D'UNE PARTICIPANTE DÉCOUVERTE (5 jours) N'EST PAS MESURÉ : il n'est pas retiré des 159 reversés à Patrick.

4. LES CHARGES RELEVÉES COMPTENT AUSSI les versements TVA à l'AFC (charge_sans_tva) et les versements à Cornelia (charge_exploitation — une rente, v0.8.5 point 3). Non retirés ici.

5. L'ENTONNOIR (v0.8.5, point 0) reste la mesure qui manque : combien d'animateurs animent réellement chaque semaine.$txt$,
  $txt$=== v0.9.0 — LES CHARGES SUIVENT LE VOLUME (DEC Patrick 25.09.2026) ===

v0.8.5 disait « les charges ne bougent pas avec le nombre ». Faux dès qu'on regarde les relevés : Supabase passe de 0 à 58,73 CHF/mois et Anthropic de 4 à 310 CHF/mois entre janvier et août 2026, au rythme des apprenantes.

Et le point de bascule ne portait que ce que la banque montre. Il manquait ce que Patrick doit couvrir sans que la banque le voie : la caisse maladie (396,25/mois, qu'il ne parvient pas à payer) et l'électricité (100/mois). Aucune charge sociale n'est générée aujourd'hui.

Le programme découverte z1 passe à 159 CHF : l'animateur anime 5 × 4 heures dans la semaine, encaisse jusqu'à 9 × 159, et reverse 1 × 159 à Patrick — soit 159 CHF par semaine et par animateur. myShaman : 179 CHF/mois en supervision active, 79 en consolidation.$txt$
);

commit;
