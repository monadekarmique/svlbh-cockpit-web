"use server";

// Server actions Facturation (Owner ST6) — V1 instrumentation audit_log.
// DEC Patrick 2026-05-20 — câblage log_audit_event pour valider la chaîne
// d'instrumentation depuis Bearer reader patrickbays.local.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ensureOwner() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx, cercle_lumiere_sr")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  const isOwner =
    me?.stx === "ST6" || me?.cercle_lumiere_sr === true;
  if (!isOwner) throw new Error("Accès refusé (Owner ST6 only)");
  return sb;
}

export async function markInvoicePaid(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  if (!invoiceId) throw new Error("invoice_id requis");

  const sb = await ensureOwner();

  // Read before for audit log
  const { data: before, error: beforeError } = await sb
    .from("invoice")
    .select("invoice_id, numero, status, total, currency, paid_at")
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (beforeError) throw new Error(`Read échec : ${beforeError.message}`);
  if (!before) throw new Error("invoice introuvable");
  if (before.status === "PAID") return; // no-op idempotent

  const paidAtIso = new Date().toISOString();
  const { error: updateError } = await sb
    .from("invoice")
    .update({ status: "PAID", paid_at: paidAtIso })
    .eq("invoice_id", invoiceId);
  if (updateError) throw new Error(`UPDATE échec : ${updateError.message}`);

  // Audit log via RPC SECURITY DEFINER (acteur via auth_svlbh_id)
  await sb.rpc("log_audit_event", {
    p_action: "UPDATE",
    p_target_table: "invoice",
    p_target_row_id: invoiceId,
    p_payload: {
      field: "status",
      before: { status: before.status, paid_at: before.paid_at },
      after: { status: "PAID", paid_at: paidAtIso },
      numero: before.numero,
      total: before.total,
      currency: before.currency,
    },
    p_via: "cockpit-facturation",
  });

  revalidatePath("/facturation");
  revalidatePath("/statutspostfinance");
}
