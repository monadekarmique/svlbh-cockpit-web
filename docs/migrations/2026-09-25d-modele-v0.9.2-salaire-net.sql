-- 2026-09-25 — Modèle v0.9.2 : le salaire de Patrick entre dans ce qu'il faut couvrir.
--
-- Patrick, 25.09.2026, mot pour mot : « il faut compter avec 3500 net de salaire »
--
-- Delta sur v0.9.1 (append-only). La page l'ajoute aux charges à couvrir chaque mois.

begin;

insert into public.modele_version (version, fige_le, fige_par, parametres, ouvert, note)
values (
  'v0.9.2', '2026-09-25', 'patrick',
  $json${
    "base": "v0.9.1 — seul le salaire change (25.09)",
    "charges_patrick": {
      "salaire_net_mois": 3500,
      "salaire": "il faut compter avec 3500 net de salaire (DEC Patrick 25.09)"
    }
  }$json$::jsonb,
  $txt$⛔ CE QUI RESTE OUVERT DANS v0.9.2 :

1. LA CAISSE MALADIE (396,25) ET L'ÉLECTRICITÉ (100) sont comptées EN PLUS des 3 500 nets, comme Patrick les a listées. S'il les paie sur son salaire, elles sont comptées deux fois.

2. UN SALAIRE NET suppose des charges sociales (AVS/AI/APG) : v0.9.0 dit « aucune générée actuellement » et le modèle en compte 0. Non tranché.

3. Tout ce qui restait ouvert dans v0.9.1 (prix de la consolidation myShaman Family, facturation inchangée, coût d'une apprenante = chiffre de Patrick).$txt$,
  $txt$=== v0.9.2 — LE SALAIRE (DEC Patrick 25.09.2026) ===

Le point de bascule couvre désormais un salaire net de 3 500 CHF par mois pour Patrick, en plus des charges relevées, de la caisse maladie et de l'électricité.$txt$
);

commit;
