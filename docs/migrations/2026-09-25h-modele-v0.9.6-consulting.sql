-- 2026-09-25 — Modèle v0.9.6 : les journées de consulting.
--
-- Patrick, 25.09.2026, mot pour mot :
--   « Je vais aussi prévoir des journées de consulting à CHF 1997 la jourée par
--     parquet de 5 jours sur 14 jours »
--
-- Delta sur v0.9.5 (append-only). Dans la simulation : prix 1 997 (la journée),
-- 5 paiements (les 5 journées du paquet), quantité = paquets sur l'année.

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.6', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.5 — les journées de consulting entrent (25.09)",
    "consulting": {
      "nom": "Journées de consulting",
      "prix_jour": 1997,
      "jours_par_paquet": 5,
      "paquet": "5 jours sur 14 jours"
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.6 :

1. LE CONSULTING est compté 1 997 × 5 jours par paquet ; le nombre de paquets par an n'est pas dit (0 au départ).

2. Tout ce qui restait ouvert dans v0.9.5 (lecture « annuel », bornes basses des fourchettes, durée des deux lignes à 599, scénario avec formatrices, HT contre TTC, facturation inchangée).$txt$,
  $txt$=== v0.9.6 — LE CONSULTING (DEC Patrick 25.09.2026) ===

Des journées de consulting à 1 997 CHF la journée, par paquet de 5 jours sur 14 jours.$txt$
);

commit;
