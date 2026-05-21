// Client API PostFinance Checkout — wrapper fetch avec auth MAC.
// DEC Patrick 2026-05-21.

import { signRequest } from "./mac-auth";

const PF_BASE_URL = process.env.PF_CHECKOUT_BASE_URL ?? "https://checkout.postfinance.ch";

export type PfCredentials = {
  userId: string; // pf_app_user_id (ex: "170682")
  authKeyBase64: string; // base64 secret HMAC
};

export type PfRequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Path absolu commençant par "/api/...". Query params à fournir dans path. */
  path: string;
  credentials: PfCredentials;
  body?: unknown;
  /** Timeout en ms (default 15s). */
  timeoutMs?: number;
};

export class PfApiError extends Error {
  constructor(
    public status: number,
    public path: string,
    public method: string,
    public bodyText: string,
  ) {
    super(`PostFinance ${method} ${path} → HTTP ${status}: ${bodyText.slice(0, 200)}`);
    this.name = "PfApiError";
  }
}

/**
 * Appelle l'API PostFinance Checkout avec signature MAC.
 * Lance PfApiError si la réponse n'est pas 2xx.
 */
export async function pfFetch<T = unknown>(opts: PfRequestOptions): Promise<T> {
  const { method, path, credentials, body, timeoutMs = 15000 } = opts;

  // Construction du path utilisé pour signer : doit être exactement ce que
  // le serveur PF voit côté URL après le domaine, query string incluse.
  const headers = signRequest({
    method,
    pathWithQuery: path,
    userId: credentials.userId,
    authKeyBase64: credentials.authKeyBase64,
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${PF_BASE_URL}${path}`, {
      method,
      headers: {
        ...headers,
        "Content-Type": "application/json;charset=utf-8",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    throw new PfApiError(res.status, path, method, text);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
