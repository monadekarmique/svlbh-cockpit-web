"use server";

// Server actions Facturation.
// DEC Patrick 2026-05-20 — câblage log_audit_event V1.
// DEC Patrick 23.09.2026 — l'enregistrement d'un paiement est réservé au
// propriétaire, lu par la fonction de base is_owner_st6(). C'est exactement la
// RLS de invoice : seule invoice_st6_owner_all écrit (invoice_own_select ne
// fait que lire) — une non-propriétaire ne pouvait déjà rien mettre à jour.

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
  const { data: isOwner, error } = await sb.rpc("is_owner_st6");
  if (error) throw new Error(`Gate échec : ${error.message}`);
  if (isOwner !== true) {
    throw new Error("Accès refusé (réservé au propriétaire)");
  }
  return { sb };
}

// Saisie manuelle d'un paiement reçu. Form fields :
//   - invoice_id (UUID, required)
//   - paid_at    (date YYYY-MM-DD, required)
//   - method     (twint | bank_transfer | cash | check | other, required)
//   - amount     (decimal, optional — défaut = invoice.total)
//   - note       (text libre, optional)
//
// Propriétaire seul (is_owner_st6()), qui peut marquer payée toute facture.
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

  const { sb } = await ensureGate();

  // Read before for audit
  const { data: before, error: beforeError } = await sb
    .from("invoice")
    .select(
      "invoice_id, numero, status, total, currency, paid_at, payment_method, notes, praticienne_svlbh_id",
    )
    .eq("invoice_id", invoiceId)
    .maybeSingle();
  if (beforeError) throw new Error(`Read échec : ${beforeError.message}`);
  if (!before) throw new Error("invoice introuvable");

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
    p_via: "cockpit-facturation-owner",
  });

  revalidatePath("/facturation");
  revalidatePath("/statutspostfinance");
}
