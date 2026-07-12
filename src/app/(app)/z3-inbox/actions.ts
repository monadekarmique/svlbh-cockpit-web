"use server";

// Actions serveur de l'inbox z3+z4 — gate ST4+ (alias-aware).
// Envoi : POST sur le bridge du chat, puis trace 'out' dans z3_message
// (RLS insert ST4+). L'URL d'envoi et le besoin CF Access viennent du
// REGISTRE public.bridge (source de vérité unique, DEC Patrick 2026-07-12) —
// seuls les secrets restent en env (Z4_CF_ACCESS_CLIENT_ID / _SECRET).

import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/resolve-profile";

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
  const { data: reg } = await supabase
    .from("bridge")
    .select("public_send_url, cf_access, is_active")
    .eq("id", bridge)
    .maybeSingle();
  if (!reg) return { ok: false, error: `Bridge inconnu au registre : ${bridge}` };
  if (!reg.is_active) return { ok: false, error: `Bridge ${bridge} inactif` };
  if (!reg.public_send_url) {
    return { ok: false, error: `Bridge ${bridge} sans URL d'envoi publique (registre)` };
  }
  const cfHeaders: Record<string, string> = reg.cf_access
    ? {
        "CF-Access-Client-Id": process.env.Z4_CF_ACCESS_CLIENT_ID ?? "",
        "CF-Access-Client-Secret": process.env.Z4_CF_ACCESS_CLIENT_SECRET ?? "",
      }
    : {};
  const resp = await fetch(reg.public_send_url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...cfHeaders },
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
