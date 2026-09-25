-- 2026-09-25 — Les simulations du point de bascule deviennent persistantes.
--
-- Patrick, 25.09.2026 : « mes simulaitons sont persistantes ? » — elles ne l'étaient
-- pas (état de l'onglet seulement). Une ligne par scénario (« Patrick seul »…), lue
-- et écrite par le seul propriétaire ST6, pour la retrouver de l'iMac comme de l'iPad.
--
-- ⚠️ Ce n'est PAS une version du modèle : modele_version reste figée et append-only.
--    Ici vit le jeu de Patrick, qui change à chaque frappe.

begin;

create table if not exists public.modele_simulation (
  scenario text primary key,
  etat     jsonb not null,
  maj_le   timestamptz not null default now()
);

alter table public.modele_simulation enable row level security;

drop policy if exists modele_simulation_st6_owner_select on public.modele_simulation;
create policy modele_simulation_st6_owner_select on public.modele_simulation
  for select to authenticated using ((select is_owner_st6()));
drop policy if exists modele_simulation_st6_owner_insert on public.modele_simulation;
create policy modele_simulation_st6_owner_insert on public.modele_simulation
  for insert to authenticated with check ((select is_owner_st6()));
drop policy if exists modele_simulation_st6_owner_update on public.modele_simulation;
create policy modele_simulation_st6_owner_update on public.modele_simulation
  for update to authenticated using ((select is_owner_st6())) with check ((select is_owner_st6()));

revoke all on public.modele_simulation from anon;
revoke all on public.modele_simulation from authenticated;
grant select, insert, update on public.modele_simulation to authenticated;

commit;
