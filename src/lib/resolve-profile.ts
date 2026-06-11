// Résolution alias-aware du profil praticienne — doctrine #11 multi-comptes.
// Un même humain peut avoir plusieurs auth.users (2e Apple ID, Hide My Email…) ;
// praticienne_user_alias mappe chaque supabase_user_id vers le svlbh_id canonique.
// Lookup : direct par supabase_user_id, puis fallback via l'alias.
// Requiert les policies RLS alias-aware (migration rls_alias_aware_self_policies).
// Cas déclencheur : Flavia bloquée cockpit 2026-06-11 (signin 2e Apple ID).

import { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export async function resolveProfile<T = Record<string, unknown>>(
  supabase: SupabaseServer,
  userId: string,
  columns: string,
): Promise<T | null> {
  const direct = await supabase
    .from("praticienne_profile")
    .select(columns)
    .eq("supabase_user_id", userId)
    .maybeSingle();
  if (direct.data) return direct.data as T;

  const { data: alias } = await supabase
    .from("praticienne_user_alias")
    .select("svlbh_id")
    .eq("supabase_user_id", userId)
    .maybeSingle();
  if (!alias?.svlbh_id) return null;

  const viaAlias = await supabase
    .from("praticienne_profile")
    .select(columns)
    .eq("svlbh_id", alias.svlbh_id)
    .maybeSingle();
  return (viaAlias.data as T) ?? null;
}
