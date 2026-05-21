// PostFinance Checkout — gestion des webhook listeners par praticienne.
// DEC Patrick 2026-05-21. Brief v1 onboarding sandbox V3.
//
// On crée 1 webhook listener par praticienne, pointant vers le scenario
// Make.com #8998624 (hook.eu2.make.com/<token>) qui traite les events
// transactionnels (PAID, FAILED, FULFILL, etc.) côté SVLBH.

import { pfFetch, type PfCredentials } from "./api-client";

/** Types pour l'API PostFinance Checkout (subset utile). */
export type WebhookListener = {
  id: number;
  state: "ACTIVE" | "INACTIVE";
  name: string;
  url: string;
  spaceId: number;
  entity: number;
  entityStates: string[];
  notifyEveryChange: boolean;
  /** Présent uniquement à la création — secret HMAC partagé pour vérifier les payloads entrants. */
  identity?: { id: number; publicKey?: string };
};

/** Types d'entités PF — les IDs sont stables côté API.
 *  Source : https://checkout.postfinance.ch/doc/api/web-service#webhook-listener
 *  ID 1472041829003 = transaction. */
export const PF_ENTITY_TRANSACTION = 1472041829003 as const;
export const PF_TRANSACTION_STATES = [
  "CREATE",
  "FAILED",
  "FULFILL",
  "PAID",
  "VOIDED",
  "REFUNDED",
  "DECLINE",
  "DONE",
] as const;

/**
 * Crée un webhook listener pour une praticienne.
 * Renvoie l'ID + le secret (à chiffrer côté DB avant stockage).
 */
export async function createWebhookListener({
  credentials,
  spaceId,
  name,
  url,
  entityStates = [...PF_TRANSACTION_STATES],
  entity = PF_ENTITY_TRANSACTION,
  notifyEveryChange = false,
}: {
  credentials: PfCredentials;
  spaceId: string | number;
  name: string;
  url: string;
  entityStates?: readonly string[];
  entity?: number;
  notifyEveryChange?: boolean;
}): Promise<WebhookListener> {
  return pfFetch<WebhookListener>({
    method: "POST",
    path: `/api/webhook-listener/create?spaceId=${spaceId}`,
    credentials,
    body: {
      state: "ACTIVE",
      name,
      url,
      entity,
      entityStates,
      notifyEveryChange,
    },
  });
}

/** Supprime un webhook listener par ID. */
export async function deleteWebhookListener({
  credentials,
  spaceId,
  id,
}: {
  credentials: PfCredentials;
  spaceId: string | number;
  id: string | number;
}): Promise<void> {
  await pfFetch({
    method: "POST",
    path: `/api/webhook-listener/delete?spaceId=${spaceId}`,
    credentials,
    body: id,
  });
}

/** Liste les webhook listeners actuels d'un Space. */
export async function listWebhookListeners({
  credentials,
  spaceId,
}: {
  credentials: PfCredentials;
  spaceId: string | number;
}): Promise<WebhookListener[]> {
  return pfFetch<WebhookListener[]>({
    method: "POST",
    path: `/api/webhook-listener/search?spaceId=${spaceId}`,
    credentials,
    body: { filter: null, language: null, numberOfEntities: 100 },
  });
}
