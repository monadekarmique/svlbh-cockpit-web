// Inbox z3 (certifiées-pro) — la queue WhatsApp +41 79 930 28 00 dans le
// cockpit, gated ST4+ (DEC Patrick 2026-06-12, option 1 : bridge → webhook
// → z3_message → cockpit, réponses via z3-bridge /api/send).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/resolve-profile";
import { fetchZ3Messages } from "./actions";
import { Z3InboxClient } from "./z3-inbox-client";

export const dynamic = "force-dynamic";

export default async function Z3InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = await resolveProfile<{ stx: string | null }>(supabase, user.id, "stx");
  if (!me?.stx || !["ST4", "ST5", "ST6"].includes(me.stx)) redirect("/dashboard");

  const messages = await fetchZ3Messages();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-1">📥 Queue z3 + z4 — certifiées & pédago</h1>
      <p className="text-sm text-gray-500 mb-4">
        WhatsApp +41 79 930 28 00 (z3) et +41 79 913 82 00 (z4) · chaque fil répond
        depuis son propre numéro · réservé ST4+
      </p>
      <Z3InboxClient initial={messages} />
    </div>
  );
}
