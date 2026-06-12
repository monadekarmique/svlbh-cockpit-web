"use server";

// Actions serveur de l'inbox z3 (certifiées-pro) — gate ST4+ (alias-aware).
// Envoi : POST sur le bridge z3 exposé (z3-bridge.svlbh.com) avec le JID
// complet du chat, puis trace 'out' dans z3_message (RLS insert ST4+).

import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/resolve-profile";

const Z3_SEND_URL = "https://z3-bridge.svlbh.com/api/send";
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
};

export async function fetchZ3Messages(sinceIso?: string): Promise<Z3Message[]> {
  const { supabase } = await requireSt4();
  let q = supabase
    .from("z3_message")
    .select(
      "id, wa_message_id, chat_jid, chat_name, sender, sender_name, direction, content, media_type, wa_timestamp, read_at, created_at",
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
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await requireSt4();
  const text = content.trim();
  if (!text) return { ok: false, error: "Message vide" };
  if (!/^[0-9]+@(s\.whatsapp\.net|lid|g\.us)$/.test(chatJid)) {
    return { ok: false, error: "JID invalide" };
  }
  const resp = await fetch(Z3_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  });
  return { ok: true };
}

export async function markChatRead(chatJid: string): Promise<void> {
  const { supabase } = await requireSt4();
  await supabase
    .from("z3_message")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_jid", chatJid)
    .is("read_at", null)
    .eq("direction", "in");
}
