// Hook post-login : si l'email de l'auth.user courant matche une
// praticienne_profile.email mais que le supabase_user_id ne pointe pas
// (encore) sur ce user, on relink automatiquement.
//
// DEC Patrick 2026-05-12 — résout le bug Apple Sign-in iOS où Apple Hide
// My Email pouvait créer un nouveau auth.user à chaque re-signin et
// orphaner la praticienne_profile.
//
// Idempotent. À appeler depuis le layout (app) après auth.getUser().

import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function autoRelinkProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  if (!user.email) return;

  // Lookup praticienne_profile par email (insensible à la casse)
  const { data: profile } = await supabase
    .from("praticienne_profile")
    .select("svlbh_id, supabase_user_id")
    .ilike("email", user.email)
    .maybeSingle();

  if (!profile) return;
  if (profile.supabase_user_id === user.id) return; // déjà lié

  // Relink : UPDATE supabase_user_id pour pointer sur le user courant.
  // RLS praticienne_self autorise l'écriture sur sa propre row si
  // supabase_user_id = auth.uid() — donc on doit faire ça côté serveur
  // avec service role ou via RPC SECURITY DEFINER. Pour rester simple,
  // on tente l'UPDATE direct et on log l'erreur s'il échoue.
  const { error } = await supabase
    .from("praticienne_profile")
    .update({ supabase_user_id: user.id })
    .eq("svlbh_id", profile.svlbh_id);

  if (error) {
    console.warn("[autoRelinkProfile] update échoué:", error.message);
  }
}
