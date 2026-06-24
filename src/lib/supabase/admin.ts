// Client Supabase service_role pour les route handlers `app/api/*` qui n'ont pas de
// session utilisateur (ex /api/self-view : génère un magic-link pour la WebView native).
//
// IMPORTANT : ne JAMAIS importer ce client dans du code client-side. Côté serveur seulement.
// Variable env requise sur Render (service svlbh-cockpit-web) : SUPABASE_SERVICE_ROLE_KEY.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
