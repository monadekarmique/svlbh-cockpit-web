-- 2026-09-25 (15h3x) — Modèle v0.9.1 : les parcours et le coût d'une apprenante.
--
-- Patrick, 25.09.2026, mot pour mot :
--   « MyShaman 179 par mosi sur 5 mois avec 4 à 8 mois de consolidation à CHF 59.
--     MyShaman Family 179 par mois sur 5 mois avec 3-4 mois de consolidation ,
--     Programme je découvre ma Vibration de thérapeute CHF 359 x 6 mois . possible
--     de d'ajouter en option avec myShamanFamily. »
--   « une apprenante va me couter CHF 129 par an »
--
-- v0.9.1 est un delta sur v0.9.0 (append-only) : myShaman consolidation passe de
-- 79 à 59 et prend ses durées ; myShaman Family et le programme Vibration entrent ;
-- le coût d'une apprenante devient le chiffre de Patrick (129 CHF par an).
--
-- ⚠️ NON DIT, donc NON INVENTÉ : le prix mensuel de la consolidation myShaman
--    Family (sa durée est dite, 3 à 4 mois ; son montant non). La page l'affiche
--    « à fixer ».
-- ⚠️ product_catalog (facturation) toujours pas touché.

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.1', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.0 — seuls les paramètres ci-dessous changent (25.09, 15h3x)",
    "myshaman": {
      "supervision_active_mois": 179,
      "supervision_active_duree": "5 mois",
      "consolidation_mois": 59,
      "consolidation_duree": "4 à 8 mois"
    },
    "myshamanfamily": {
      "supervision_active_mois": 179,
      "supervision_active_duree": "5 mois",
      "consolidation_duree": "3 à 4 mois",
      "consolidation_prix": "non dit le 25.09"
    },
    "vibration_therapeute": {
      "nom": "Programme je découvre ma Vibration de thérapeute",
      "prix_mois": 359,
      "duree": "6 mois",
      "option": "possible en option avec myShaman Family"
    },
    "charges_patrick": {
      "cout_apprenante_an": 129,
      "cout_apprenante": "une apprenante va coûter 129 CHF par an (DEC Patrick 25.09)"
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.1 :

1. LE PRIX DE LA CONSOLIDATION myShaman Family n'est pas dit (sa durée l'est : 3 à 4 mois).

2. LA FACTURATION N'A PAS BOUGÉ. product_catalog dit myShaman 99 CHF/mois sur 9 mois (ABO_MYSHAMAN_9M) et myShaman Family 179 CHF/mois sur 15 mois (ABO_MYSHAMANFAMILY_15M) ; le modèle dit 179 × 5 puis 59 × 4 à 8 (myShaman), 179 × 5 puis 3 à 4 mois (Family). Le programme Vibration n'existe pas au catalogue.

3. LE COÛT D'UNE APPRENANTE est le chiffre de Patrick (129 CHF/an, soit 10,75/mois). La banque mesure autre chose : Supabase + Anthropic sur juin–août = 345,42/mois pour 10 femmes qui paient (34,54/mois), abonnements Claude de la flotte compris. Le modèle suit Patrick.

4. Restent ouverts de v0.9.0 : le coût d'une participante découverte (non retiré), la TVA et les versements à Cornelia comptés dans les charges relevées, l'entonnoir.$txt$,
  $txt$=== v0.9.1 — LES PARCOURS ET LE COÛT D'UNE APPRENANTE (DEC Patrick 25.09.2026) ===

myShaman : 179 CHF par mois pendant 5 mois de supervision active, puis 4 à 8 mois de consolidation à 59 CHF (et non plus 79, v0.9.0).
myShaman Family : 179 CHF par mois pendant 5 mois, puis 3 à 4 mois de consolidation.
Programme je découvre ma Vibration de thérapeute : 359 CHF × 6 mois, possible en option avec myShaman Family.
Une apprenante coûte 129 CHF par an.$txt$
);

commit;
