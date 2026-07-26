"use server";

// Server actions Admin (Owner ST6 + Admin ST5) — stage et statut praticienne.
// DEC Patrick 2026-05-20. Durci le 2026-07-26 après code-review :
// - garde d'abord (rien ne se valide avant l'authentification) ;
// - alias-aware via resolveProfile (doctrine #11, cas Flavia 2026-06-11) ;
// - pro_status ACTIVE exigé de l'acteur (une suspendue ne administre pas) ;
// - contrôle « 0 ligne modifiée » sur les DEUX actions (sinon un blocage RLS
//   écrivait un événement d'audit fantôme) ;
// - le Owner ne peut pas se retirer lui-même son statut ACTIVE ;
// - SUSPEND/MIGRATE tracés comme retraits d'accès, pas comme UPDATE générique.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveProfile } from "@/lib/resolve-profile";

const ALLOWED_STX = ["ST0", "ST1", "ST2", "ST3", "ST4", "ST5", "ST6"] as const;

// Valeurs RÉELLES de l'enum Postgres pro_status — source unique partagée avec
// la page (« INACTIVE » n'existait pas et tuait la page, incident 26.07).
export const PRO_STATUSES = ["ACTIVE", "SUSPENDED", "REVOKED", "MIGRATED"] as const;
export type ProStatus = (typeof PRO_STATUSES)[number];

async function ensureAdmin(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any;
  actorStx: "ST5" | "ST6";
  actorSvlbhId: string;
}> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const me = await resolveProfile<{ svlbh_id: string; stx: string | null; pro_status: string | null }>(
    sb, user.id, "svlbh_id, stx, pro_status",
  );
  if (me?.stx !== "ST5" && me?.stx !== "ST6") {
    throw new Error("Accès refusé (Admin ST5/ST6 only)");
  }
  if (me.pro_status !== "ACTIVE") {
    throw new Error("Accès refusé (statut praticienne non ACTIVE)");
  }
  return { sb, actorStx: me.stx as "ST5" | "ST6", actorSvlbhId: me.svlbh_id };
}

/** Anne (ST5) ne peut pas toucher au stx/statut de Patrick (ST6) ni d'une autre ST5. */
function protectSeniors(actorStx: "ST5" | "ST6", targetStx: string | null): void {
  if (actorStx === "ST6") return; // Owner peut tout
  if (targetStx === "ST5" || targetStx === "ST6") {
    throw new Error("ST5 ne peut pas modifier ST5/ST6 (réservé Owner)");
  }
}

export async function setPraticienneStx(formData: FormData) {
  const { sb, actorStx } = await ensureAdmin();

  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  const newStx = String(formData.get("new_stx") ?? "").trim();

  if (!svlbhId) throw new Error("svlbh_id requis");
  // « Appliquer » sans avoir ouvert le menu (section « Sans stage attribué ») :
  // no-op silencieux plutôt qu'une page morte.
  if (newStx === "") return;
  if (!(ALLOWED_STX as readonly string[]).includes(newStx)) {
    throw new Error(`stx invalide : ${newStx}`);
  }

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
  const { sb, actorStx, actorSvlbhId } = await ensureAdmin();

  const svlbhId = String(formData.get("svlbh_id") ?? "").trim();
  const newStatus = String(formData.get("new_pro_status") ?? "").trim();

  if (!svlbhId) throw new Error("svlbh_id requis");
  if (!(PRO_STATUSES as readonly string[]).includes(newStatus)) {
    throw new Error(`pro_status invalide : ${newStatus}`);
  }

  // Auto-verrouillage interdit : l'Owner qui se met SUSPENDED perdrait
  // is_owner_st6() partout, récupération SQL uniquement.
  if (svlbhId === actorSvlbhId && newStatus !== "ACTIVE") {
    throw new Error("Tu ne peux pas retirer ton propre statut ACTIVE depuis cet écran.");
  }

  const { data: before } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, stx, pro_status")
    .eq("svlbh_id", svlbhId)
    .maybeSingle();
  if (!before) throw new Error("praticienne introuvable");
  if (before.pro_status === newStatus) return;

  // Garde-fou : ST5 ne peut pas révoquer/modifier le statut d'une ST5/ST6
  protectSeniors(actorStx, before.stx);

  const { data, error } = await sb
    .from("praticienne_profile")
    .update({ pro_status: newStatus })
    .eq("svlbh_id", svlbhId)
    .select("svlbh_id");
  if (error) throw new Error(`UPDATE échec : ${error.message}`);
  if (!data || data.length === 0) {
    // Sans ce contrôle, un blocage RLS écrivait un audit-event FANTÔME
    // (changement jamais advenu) — trouvé par la revue du 26.07.
    throw new Error("Aucune ligne modifiée — RLS a bloqué (policy Owner ?)");
  }

  // Un retrait d'accès se retrouve par son action, pas enfoui dans les UPDATE.
  const auditAction =
    newStatus === "REVOKED" ? "REVOKE"
    : newStatus === "SUSPENDED" ? "SUSPEND"
    : newStatus === "MIGRATED" ? "MIGRATE"
    : "UPDATE";

  await sb.rpc("log_audit_event", {
    p_action: auditAction,
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
