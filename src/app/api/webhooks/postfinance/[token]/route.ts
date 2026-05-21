// Webhook receiver direct PostFinance Checkout — endpoint cockpit (option B).
// DEC Patrick 2026-05-21. Bypass Make.com pour rester 100% CH/EU dans data flow.
//
// Flow :
//   1. PF POST sur /api/webhooks/postfinance/<url_token>
//   2. RPC pf_webhook_authenticate(token) → retourne credentials déchiffrées
//   3. Fetch transaction PF via /api/transaction/read avec credentials
//   4. Classification heuristique (merchantReference / amount → service_code)
//   5. UPDATE invoice si merchantReference matche F-XXXX
//   6. log_audit_event action=PAYMENT_RECEIVED
//   7. Forward optionnel vers svlbh-pro-1-backend (compat ancien pipeline)
//
// Path /api/webhooks/postfinance/* whitelisté dans middleware proxy.ts.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readTransaction, type PfTransaction } from "@/lib/postfinance-checkout/transaction";

export const dynamic = "force-dynamic";

type WebhookPayload = {
  entityId?: number | string;
  entityKey?: string;
  listenerEntityTechnicalName?: string;
  listenerEntityId?: number | string;
  spaceId?: number | string;
  timestamp?: string;
  webhookListenerId?: number | string;
};

type AuthRow = {
  svlbh_id: string;
  display_code: string | null;
  first_name: string | null;
  last_name: string | null;
  pf_environment: string | null;
  pf_space_id: string | null;
  pf_app_user_id: string | null;
  pf_auth_key: string;
  pf_webhook_id: string | null;
};

// Heuristique de classification : montant + merchantReference → service_code
function classify(tx: PfTransaction): {
  service_code: string;
  action: "mark_invoice_paid" | "activate" | "ignore";
  invoice_numero: string | null;
} {
  const ref = (tx.merchantReference ?? "").trim();
  const amount = tx.completedAmount ?? tx.authorizedAmount ?? 0;

  // Facture SVLBH : F-XXXX-XXXX ou F2026-XXXX ou NC2026-XXXX
  if (/^(F|NC)[-]?\d{4}[-]?\d{3,5}$/i.test(ref)) {
    return { service_code: "facture_svlbh_pro_1", action: "mark_invoice_paid", invoice_numero: ref };
  }
  if (Math.abs(amount - 29) < 0.5) {
    return { service_code: "endo_14j", action: "activate", invoice_numero: null };
  }
  if (Math.abs(amount - 59) < 0.5) {
    return { service_code: "decouverte_59", action: "activate", invoice_numero: null };
  }
  if (Math.abs(amount - 100) < 0.5) {
    return { service_code: "mysha_100", action: "activate", invoice_numero: null };
  }
  return { service_code: "don", action: "ignore", invoice_numero: null };
}

function isPaidState(state: string): boolean {
  return state === "FULFILL" || state === "COMPLETED" || state === "DONE";
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  // Lecture body brut
  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // 1. Authentification webhook via token URL
  const sb = await createClient();
  const { data: authRows, error: authErr } = await sb.rpc("pf_webhook_authenticate", {
    p_token: token,
  });
  if (authErr) {
    return NextResponse.json({ error: "auth rpc failed" }, { status: 500 });
  }
  const auth = (authRows as AuthRow[] | null)?.[0];
  if (!auth) {
    return NextResponse.json({ error: "unknown webhook token" }, { status: 404 });
  }

  const entityId = payload.entityId ?? null;
  const spaceId = String(payload.spaceId ?? auth.pf_space_id ?? "");

  if (!entityId) {
    return NextResponse.json({ error: "missing entityId" }, { status: 400 });
  }
  // Sanity check : le spaceId du webhook doit matcher la praticienne
  if (auth.pf_space_id && spaceId && auth.pf_space_id !== spaceId) {
    await sb.rpc("log_audit_event", {
      p_action: "PAYMENT_REJECTED",
      p_target_table: "praticienne_profile",
      p_target_row_id: auth.svlbh_id,
      p_payload: {
        reason: "spaceId mismatch",
        webhook_space_id: spaceId,
        praticienne_space_id: auth.pf_space_id,
        entity_id: entityId,
      },
      p_via: "postfinance-webhook",
    });
    return NextResponse.json({ error: "spaceId mismatch" }, { status: 403 });
  }

  // 2. Fetch transaction details via PF API
  let tx: PfTransaction;
  try {
    tx = await readTransaction({
      credentials: { userId: auth.pf_app_user_id!, authKeyBase64: auth.pf_auth_key },
      spaceId: auth.pf_space_id!,
      transactionId: entityId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await sb.rpc("log_audit_event", {
      p_action: "PAYMENT_FETCH_FAILED",
      p_target_table: "praticienne_profile",
      p_target_row_id: auth.svlbh_id,
      p_payload: { entity_id: entityId, error: msg },
      p_via: "postfinance-webhook",
    });
    return NextResponse.json({ error: `fetch tx failed: ${msg}` }, { status: 502 });
  }

  // 3. Classification + action
  const cls = classify(tx);
  const paid = isPaidState(tx.state);
  let invoiceUpdated: { invoice_id: string; before_status: string } | null = null;

  if (paid && cls.action === "mark_invoice_paid" && cls.invoice_numero) {
    const { data: invBefore } = await sb
      .from("invoice")
      .select("invoice_id, status, paid_at")
      .eq("numero", cls.invoice_numero)
      .maybeSingle();
    if (invBefore && invBefore.status !== "PAID") {
      const { error: updErr } = await sb
        .from("invoice")
        .update({ status: "PAID", paid_at: new Date().toISOString() })
        .eq("invoice_id", invBefore.invoice_id);
      if (!updErr) {
        invoiceUpdated = {
          invoice_id: invBefore.invoice_id,
          before_status: invBefore.status ?? "?",
        };
      }
    }
  }

  // 4. Audit log
  await sb.rpc("log_audit_event", {
    p_action: paid ? "PAYMENT_RECEIVED" : "PAYMENT_EVENT",
    p_target_table: invoiceUpdated ? "invoice" : "praticienne_profile",
    p_target_row_id: invoiceUpdated?.invoice_id ?? auth.svlbh_id,
    p_payload: {
      pf_transaction_id: tx.id,
      pf_state: tx.state,
      pf_amount: tx.completedAmount ?? tx.authorizedAmount,
      pf_currency: tx.currency,
      merchant_reference: tx.merchantReference,
      service_code: cls.service_code,
      action: cls.action,
      praticienne_display_code: auth.display_code,
      praticienne_name: `${auth.first_name ?? ""} ${auth.last_name ?? ""}`.trim(),
      invoice_updated: invoiceUpdated,
      payer_email: tx.customerEmailAddress ?? tx.billingAddress?.emailAddress ?? null,
    },
    p_via: "postfinance-webhook",
  });

  return NextResponse.json({
    ok: true,
    pf_transaction_id: tx.id,
    pf_state: tx.state,
    service_code: cls.service_code,
    action_taken: cls.action,
    invoice_updated: invoiceUpdated,
  });
}
