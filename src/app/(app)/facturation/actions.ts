"use server";

// Server actions Facturation.
// DEC Patrick 2026-05-20 — câblage log_audit_event V1.
// DEC Patrick 2026-06-04 — ouverture aux thérapeutes ST4+ pour saisir
// leurs propres paiements reçus manuellement (TWINT, virement, espèces,
// chèque), en attendant l'intégration PostFinanceCheckout.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const VALID_METHODS = new Set([
  "twint",
  "bank_transfer",
  "cash",
  "check",
  "other",
]);

async function ensureGate() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, stx, pro_status")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (!me || me.pro_status !== "ACTIVE") {
    throw new Error("Accès refusé (compte inactif)");
  }
  const stx = me.stx as string;
  const allowed = stx === "ST4" || stx === "ST5" || stx === "ST6";
  if (!allowed) {
    throw new Error("Accès refusé (ST4+ requis)");
  }
  // DEC Patrick 2026-06-04 : Owner = ST6 strict pour cette page
  // (cohérent avec RLS invoice_st6_owner_all / is_owner_st6()).
  const isOwner = stx === "ST6";
  return {
    sb,
    svlbhId: me.svlbh_id as string,
    isOwner,
  };
}

// Saisie manuelle d'un paiement reçu. Form fields :
//   - invoice_id (UUID, required)
//   - paid_at    (date YYYY-MM-DD, required)
//   - method     (twint | bank_transfer | cash | check | other, required)
//   - amount     (decimal, optional — défaut = invoice.total)
//   - note       (text libre, optional)
//
// Ownership : Owner (ST6/Cercle SR) peut tout marquer payé. ST4/ST5 ne
// peut marquer payée qu'une de SES propres factures (praticienne_svlbh_id).
export async function recordInvoicePayment(formData: FormData) {
  const invoiceId = String(formData.get("invoice_id") ?? "").trim();
  const paidAtRaw = String(formData.get("paid_at") ?? "").trim();
  const method = String(formData.get("method") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!invoiceId) throw new Error("invoice_id requis");
  if (!paidAtRaw) throw new Error("Date de paiement requise");
  if (!VALID_METHODS.has(method)) {
    throw new Error("Moyen de paiement invalide");
  }
  // paid_at est une date YYYY-MM-DD ; on la stocke comme timestamp à midi
  // UTC pour rester déterministe quel que soit le fuseau du serveur.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAtRaw)) {
    throw new Error("Date paid_at malformée (YYYY-MM-DD attendu)");
  }
  const paidAtIso = `${paidAtRaw}T12:00:00.000Z`;

  const { sb, svlbhId, isOwner } = await ensureGate();

  // Read before for audit + ownership check
  const { data: before, error: beforeError } = await sb
    .from("invoice")
    .select(
      "invoice_id, numero, status, total, currency, paid_at, payment_method, notes, praticienne_svlbh_id",
    )
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (beforeError) throw new Error(`Read échec : ${beforeError.message}`);
  if (!before) throw new Error("invoice introuvable");

  // Ownership : ST4/ST5 ne peut toucher que ses propres factures
  if (!isOwner && before.praticienne_svlbh_id !== svlbhId) {
    throw new Error("Accès refusé (cette facture n'est pas la vôtre)");
  }

  // Montant : défaut = invoice.total. Validation : numérique > 0.
  let amount: number;
  if (amountRaw) {
    const parsed = Number(amountRaw.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("Montant invalide");
    }
    amount = parsed;
  } else {
    amount = Number(before.total);
  }

  // Notes : on préserve l'existant et on ajoute une ligne datée.
  const stampLine = `[${paidAtRaw}] paiement reçu ${amount.toFixed(2)} ${
    before.currency ?? "CHF"
  } via ${method}${note ? ` — ${note}` : ""}`;
  const nextNotes = before.notes ? `${before.notes}\n${stampLine}` : stampLine;

  const { error: updateError } = await sb
    .from("invoice")
    .update({
      status: "PAID",
      paid_at: paidAtIso,
      payment_method: method,
      notes: nextNotes,
    })
    .eq("invoice_id", invoiceId);
  if (updateError) throw new Error(`UPDATE échec : ${updateError.message}`);

  // Audit log via RPC SECURITY DEFINER (acteur via auth_svlbh_id)
  await sb.rpc("log_audit_event", {
    p_action: "UPDATE",
    p_target_table: "invoice",
    p_target_row_id: invoiceId,
    p_payload: {
      field: "payment_recorded_manual",
      before: {
        status: before.status,
        paid_at: before.paid_at,
        payment_method: before.payment_method,
      },
      after: {
        status: "PAID",
        paid_at: paidAtIso,
        payment_method: method,
        amount,
        note: note || null,
      },
      numero: before.numero,
      total: before.total,
      currency: before.currency,
    },
    p_via: isOwner
      ? "cockpit-facturation-owner"
      : "cockpit-facturation-st4plus",
  });

  revalidatePath("/facturation");
  revalidatePath("/statutspostfinance");
}
