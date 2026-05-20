"use server";

// Server actions Admin (Owner ST6) — attribution de stage pour praticienne.
// DEC Patrick 2026-05-20.
// Defense in depth : la fonction côté DB requireOwner(), la server action
// re-check ST6, et l'audit log trace chaque mutation.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STX = ["ST0", "ST1", "ST2", "ST3", "ST4", "ST5", "ST6"] as const;

/**
 * Admin disponible pour ST5 (Anne) et ST6 (Owner Patrick).
 * Retourne (sb, actorStx) pour gardes-fous downstream.
 * DEC Patrick 2026-05-20.
 */
async function ensureAdmin(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any;
  actorStx: "ST5" | "ST6";
}> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST5" && me?.stx !== "ST6") {
    throw new Error("Accès refusé (Admin ST5/ST6 only)");
  }
  return { sb, actorStx: me.stx as "ST5" | "ST6" };
}

/** Anne (ST5) ne peut pas toucher au stx/statut de Patrick (ST6) ni d'une autre ST5. */
function protectSeniors(actorStx: "ST5" | "ST6", targetStx: string | null): void {
  if (actorStx === "ST6") return; // Owner peut tout
  if (targetStx === "ST5" || targetStx === "ST6") {
    throw new Error("ST5 ne peut pas modifier ST5/ST6 (réservé Owner)");
  }
}

export async function setPraticienneStx(formData: FormData) {
  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  const newStx = String(formData.get("new_stx") ?? "").trim();

  if (!svlbhId) throw new Error("svlbh_id requis");
  if (!(ALLOWED_STX as readonly string[]).includes(newStx)) {
    throw new Error(`stx invalide : ${newStx}`);
  }

  const { sb, actorStx } = await ensureAdmin();

  // Lecture before pour audit log + garde-fou
  const { data: before } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, stx, code_praticien")
    .eq("svlbh_id", svlbhId)
    .maybeSingle();
  if (!before) throw new Error("praticienne introuvable");
  if (before.stx === newStx) return; // no-op

  // Garde-fou : ST5 ne peut pas modifier ST5/ST6, et ne peut pas promouvoir à ST5/ST6
  protectSeniors(actorStx, before.stx);
  protectSeniors(actorStx, newStx);

  const { data, error } = await sb
    .from("praticienne_profile")
    .update({ stx: newStx })
    .eq("svlbh_id", svlbhId)
    .select("svlbh_id");

  if (error) throw new Error(`UPDATE échec : ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Aucune ligne modifiée — RLS a bloqué (policy Owner ?)");
  }

  // Audit log via RPC
  await sb.rpc("log_audit_event", {
    p_action: "UPDATE",
    p_target_table: "praticienne_profile",
    p_target_row_id: svlbhId,
    p_payload: {
      field: "stx",
      before: before.stx,
      after: newStx,
      who: `${before.first_name ?? ""} ${before.last_name ?? ""}`.trim(),
      code: before.code_praticien,
    },
    p_via: "cockpit-admin",
  });

  revalidatePath("/admin");
  revalidatePath("/shamanes"); // les badges stx changent partout
}

export async function setPraticienneProStatus(formData: FormData) {
  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  const newStatus = String(formData.get("new_pro_status") ?? "").trim();

  if (!svlbhId) throw new Error("svlbh_id requis");
  if (!["ACTIVE", "INACTIVE", "REVOKED"].includes(newStatus)) {
    throw new Error(`pro_status invalide : ${newStatus}`);
  }

  const { sb, actorStx } = await ensureAdmin();

  const { data: before } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, stx, pro_status")
    .eq("svlbh_id", svlbhId)
    .maybeSingle();
  if (!before) throw new Error("praticienne introuvable");
  if (before.pro_status === newStatus) return;

  // Garde-fou : ST5 ne peut pas révoquer/modifier le statut d'une ST5/ST6
  protectSeniors(actorStx, before.stx);

  const { error } = await sb
    .from("praticienne_profile")
    .update({ pro_status: newStatus })
    .eq("svlbh_id", svlbhId);
  if (error) throw new Error(`UPDATE échec : ${error.message}`);

  await sb.rpc("log_audit_event", {
    p_action: newStatus === "REVOKED" ? "REVOKE" : "UPDATE",
    p_target_table: "praticienne_profile",
    p_target_row_id: svlbhId,
    p_payload: {
      field: "pro_status",
      before: before.pro_status,
      after: newStatus,
      who: `${before.first_name ?? ""} ${before.last_name ?? ""}`.trim(),
    },
    p_via: "cockpit-admin",
  });

  revalidatePath("/admin");
  revalidatePath("/shamanes");
}
