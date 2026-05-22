// PostFinance Checkout — gestion des webhook listeners par praticienne.
// DEC Patrick 2026-05-21. Brief v1 onboarding sandbox V3.
//
// Architecture PF webhooks en 2 niveaux (cause du HTTP 442 corrigée
// 2026-05-22) :
//   1. Webhook URL  : entité référençable (POST /api/webhook-url/create)
//                     porte la string URL et un id entier.
//   2. Webhook Listener : référence l'URL par son id (champ `url: <int>`),
//                         pas la string. Passer une string → HTTP 442
//                         (« Unable to convert value to property url »).
// On crée donc d'abord l'URL via createWebhookUrl(), puis le listener
// via createWebhookListener({ urlId }).

import { pfFetch, type PfCredentials } from "./api-client";

/** Webhook URL — entité référencée par les listeners. */
export type WebhookUrl = {
  id: number;
  state: "ACTIVE" | "INACTIVE";
  name: string;
  url: string;
  spaceId: number;
};

/** Types pour l'API PostFinance Checkout (subset utile). */
export type WebhookListener = {
  id: number;
  state: "ACTIVE" | "INACTIVE";
  name: string;
  /** ID entier de la WebhookUrl référencée (pas la string URL résolue). */
  url: number;
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
 * Crée une Webhook URL côté PostFinance — entité référençable.
 * À appeler AVANT createWebhookListener : son id sera passé en `urlId`.
 */
export async function createWebhookUrl({
  credentials,
  spaceId,
  name,
  url,
}: {
  credentials: PfCredentials;
  spaceId: string | number;
  name: string;
  url: string;
}): Promise<WebhookUrl> {
  return pfFetch<WebhookUrl>({
    method: "POST",
    path: `/api/webhook-url/create?spaceId=${spaceId}`,
    credentials,
    body: {
      state: "ACTIVE",
      name,
      url,
    },
  });
}

/**
 * Crée un webhook listener pour une praticienne.
 * `urlId` doit être l'id entier d'une WebhookUrl créée préalablement
 * via createWebhookUrl() (PF rejette HTTP 442 si on passe une string).
 * Renvoie l'ID + le secret (à chiffrer côté DB avant stockage).
 */
export async function createWebhookListener({
  credentials,
  spaceId,
  name,
  urlId,
  entityStates = [...PF_TRANSACTION_STATES],
  entity = PF_ENTITY_TRANSACTION,
  notifyEveryChange = false,
}: {
  credentials: PfCredentials;
  spaceId: string | number;
  name: string;
  urlId: number;
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
      url: urlId,
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
