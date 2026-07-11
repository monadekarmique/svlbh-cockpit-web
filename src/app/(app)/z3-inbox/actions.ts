"use server";

// Actions serveur de l'inbox z3+z4 — gate ST4+ (alias-aware).
// Envoi : POST sur le bridge du chat (z3-bridge / z4-bridge .svlbh.com) avec
// le JID complet, puis trace 'out' dans z3_message (RLS insert ST4+).
// z4 est derrière Cloudflare Access → headers service token requis
// (env Z4_CF_ACCESS_CLIENT_ID / Z4_CF_ACCESS_CLIENT_SECRET).

import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/resolve-profile";

const BRIDGE_SEND: Record<string, { url: string; headers: () => Record<string, string> }> = {
  z3: {
    url: "https://z3-bridge.svlbh.com/api/send",
    headers: () => ({}),
  },
  z4: {
    url: "https://z4-bridge.svlbh.com/api/send",
    headers: () => ({
      "CF-Access-Client-Id": process.env.Z4_CF_ACCESS_CLIENT_ID ?? "",
      "CF-Access-Client-Secret": process.env.Z4_CF_ACCESS_CLIENT_SECRET ?? "",
    }),
  },
};
const ALLOWED = ["ST4", "ST5", "ST6"];

async function requireSt4() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const me = await resolveProfile<{ stx: string | null }>(supabase, user.id, "stx");
  if (!me?.stx || !ALLOWED.includes(me.stx)) throw new Error("Réservé ST4+");
  return { supabase, user };
}

export type Z3Message = {
  id: string;
  wa_message_id: string | null;
  chat_jid: string;
  chat_name: string | null;
  sender: string | null;
  sender_name: string | null;
  direction: "in" | "out";
  content: string;
  media_type: string | null;
  wa_timestamp: string | null;
  read_at: string | null;
  created_at: string;
  bridge: string;
};

export async function fetchZ3Messages(sinceIso?: string): Promise<Z3Message[]> {
  const { supabase } = await requireSt4();
  let q = supabase
    .from("z3_message")
    .select(
      "id, wa_message_id, chat_jid, chat_name, sender, sender_name, direction, content, media_type, wa_timestamp, read_at, created_at, bridge",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (sinceIso) q = q.gt("created_at", sinceIso);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Z3Message[];
}

export async function sendZ3Message(
  chatJid: string,
  content: string,
  bridge: string = "z3",
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireSt4();
  const text = content.trim();
  if (!text) return { ok: false, error: "Message vide" };
  if (!/^[0-9]+@(s\.whatsapp\.net|lid|g\.us)$/.test(chatJid)) {
    return { ok: false, error: "JID invalide" };
  }
  const send = BRIDGE_SEND[bridge];
  if (!send) return { ok: false, error: `Bridge inconnu : ${bridge}` };
  const resp = await fetch(send.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...send.headers() },
    body: JSON.stringify({ recipient: chatJid, message: text }),
  });
  const body = (await resp.json().catch(() => ({}))) as {
    success?: boolean;
    message_id?: string;
    error?: string;
  };
  if (!resp.ok || !body.success) {
    return { ok: false, error: body.error ?? `Bridge ${resp.status}` };
  }
  await supabase.from("z3_message").insert({
    wa_message_id: body.message_id ?? null,
    chat_jid: chatJid,
    direction: "out",
    content: text,
    sent_by: user.id,
    wa_timestamp: new Date().toISOString(),
    bridge,
  });
  return { ok: true };
}

export async function markChatRead(chatJid: string, bridge: string = "z3"): Promise<void> {
  const { supabase } = await requireSt4();
  await supabase
    .from("z3_message")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_jid", chatJid)
    .eq("bridge", bridge)
    .is("read_at", null)
    .eq("direction", "in");
}
