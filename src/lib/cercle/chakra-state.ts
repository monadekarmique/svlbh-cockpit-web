// État des chakras (clean/blocked) par utilisateur — RLS auth.uid() = user_id.

import { createClient } from "@/lib/supabase/server";

export async function loadUserChakraStates(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from("user_chakra_state")
    .select("chakra_key")
    .eq("user_id", user.id)
    .eq("cleaned", true);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.chakra_key as string));
}

export async function setChakraCleaned(
  chakraKey: string,
  cleaned: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const { error } = await supabase.from("user_chakra_state").upsert({
    user_id: user.id,
    chakra_key: chakraKey,
    cleaned,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
