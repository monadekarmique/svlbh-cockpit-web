"use server";

// Server actions support co-browsing (DEC Patrick 2026-05-21).
// Backend = RPCs SECURITY DEFINER déjà en place (start_support_session,
// end_support_session, join_support_session). Les actions ici sont des
// wrappers qui font le revalidatePath + redirect après mutation.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_CONSENT_TEXT =
  "Je consens à partager le rendu de mon onglet navigateur actif avec un Owner SVLBH (Patrick) ou un Admin (Anne) " +
  "pendant 60 minutes maximum, à des fins d'accompagnement et de support technique. " +
  "Aucune capture de mon écran complet, aucun enregistrement persistant n'est effectué. " +
  "Je peux interrompre la session à tout moment. " +
  "Conforme LPD suisse (Art. 6 - consentement) et RGPD UE (Art. 6 §1 a).";

export async function startSupportSession(formData: FormData) {
  const note = String(formData.get("note") ?? "").trim() || null;
  const customConsent = String(formData.get("consent_text") ?? "").trim();
  const consentText = customConsent.length >= 20 ? customConsent : DEFAULT_CONSENT_TEXT;

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data, error } = await sb.rpc("start_support_session", {
    p_consent_text: consentText,
    p_note: note,
  });
  if (error) throw new Error(`Démarrage échec : ${error.message}`);

  revalidatePath("/support");
  redirect(`/support/session/${data}/praticienne`);
}

export async function endSupportSession(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  const endedBy = String(formData.get("ended_by") ?? "PRATICIENNE").trim();
  if (!sessionId) throw new Error("session_id requis");

  const sb = await createClient();
  const { error } = await sb.rpc("end_support_session", {
    p_session_id: sessionId,
    p_ended_by: endedBy,
  });
  if (error) throw new Error(`Arrêt échec : ${error.message}`);

  revalidatePath("/support");
  revalidatePath(`/support/session/${sessionId}`);
  revalidatePath(`/support/session/${sessionId}/praticienne`);
}

export async function joinSupportSession(formData: FormData) {
  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!sessionId) throw new Error("session_id requis");

  const sb = await createClient();
  const { error } = await sb.rpc("join_support_session", {
    p_session_id: sessionId,
  });
  if (error) throw new Error(`Join échec : ${error.message}`);

  revalidatePath("/support");
  redirect(`/support/session/${sessionId}`);
}
