import { pfApiCall } from './api-client';

export interface PfCredentials {
  userId: string;
  authKeyBase64: string;
}

export interface WebhookUrlEntity {
  id: number;
  name: string;
  url: string;
}

export interface WebhookListener {
  id: number;
  name: string;
  state: string;
  url?: number;
  version: number;
  identity?: {
    id?: number;
    publicKey?: string;
  };
  webhookEncryptionPublicKey?: string;
}

export async function createWebhookUrl(opts: {
  credentials: PfCredentials;
  spaceId: string;
  name: string;
  url: string;
}): Promise<WebhookUrlEntity> {
  return pfApiCall<WebhookUrlEntity>({
    userId: Number(opts.credentials.userId),
    authKeyBase64: opts.credentials.authKeyBase64,
    method: 'POST',
    path: `/api/webhook-url/create?spaceId=${opts.spaceId}`,
    body: {
      name: opts.name,
      url: opts.url,
    },
  });
}

export async function createWebhookListener(opts: {
  credentials: PfCredentials;
  spaceId: string;
  name: string;
  urlId: number;
}): Promise<WebhookListener> {
  return pfApiCall<WebhookListener>({
    userId: Number(opts.credentials.userId),
    authKeyBase64: opts.credentials.authKeyBase64,
    method: 'POST',
    path: `/api/webhook-listener/create?spaceId=${opts.spaceId}`,
    body: {
      name: opts.name,
      state: 'ACTIVE',
      url: opts.urlId,
      entity: 1472041829003,
      entityStates: ['FULFILL', 'AUTHORIZED', 'COMPLETED'],
      notifyEveryChange: false,
      enablePayloadSignatureAndState: true,
    },
  });
}

export async function listWebhookListeners(opts: {
  credentials: PfCredentials;
  spaceId: string;
}): Promise<WebhookListener[]> {
  return pfApiCall<WebhookListener[]>({
    userId: Number(opts.credentials.userId),
    authKeyBase64: opts.credentials.authKeyBase64,
    method: 'POST',
    path: `/api/webhook-listener/search?spaceId=${opts.spaceId}`,
    body: {},
  });
}

export async function deleteWebhookListener(opts: {
  credentials: PfCredentials;
  spaceId: string;
  listenerId: number;
}): Promise<void> {
  await pfApiCall({
    userId: Number(opts.credentials.userId),
    authKeyBase64: opts.credentials.authKeyBase64,
    method: 'POST',
    path: `/api/webhook-listener/delete?spaceId=${opts.spaceId}`,
    body: { id: opts.listenerId },
  });
}
