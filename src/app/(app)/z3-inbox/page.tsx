// Inbox z3 (certifiées-pro) — la queue WhatsApp +41 79 930 28 00 dans le
// cockpit (DEC Patrick 2026-06-12, option 1 : bridge → webhook
// → z3_message → cockpit, réponses via z3-bridge /api/send).
// Gate = RLS de z3_message (DEC Patrick 23.09.2026 : la règle suit le canal,
// plus le stage) : rpc peut_lire_stage(4), la fonction de la policy de lecture
// z3_message_st4_read — canal z4, ACTIVE, hors review. Qui passe le gate voit
// la file ; qui ne la verrait pas n'entre plus.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchZ3Messages } from "./actions";
import { Z3InboxClient } from "./z3-inbox-client";

export const dynamic = "force-dynamic";

export default async function Z3InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: canRead } = await supabase.rpc("peut_lire_stage", { p_min: 4 });
  if (canRead !== true) redirect("/dashboard");

  const messages = await fetchZ3Messages();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-1">📥 Queue z3 + z4 — certifiées & pédago</h1>
      <p className="text-sm text-gray-500 mb-4">
        WhatsApp +41 79 930 28 00 (z3) et +41 79 913 82 00 (z4) · chaque fil répond
        depuis son propre numéro · réservé au canal z4
      </p>
      <Z3InboxClient initial={messages} />
    </div>
  );
}
