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
        "User-Agent": "SVLBH-cockpit-web/1.0 (+https://cockpit.svlbh.com)",
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
    // Log détaillé pour diagnostic (visible Render logs côté server,
    // pas exposé au client). Ne logge PAS l'authKey (secret) — juste la
    // securedData (version|userid|timestamp|method|path) + MAC envoyé +
    // userId. Aide à différencier bug code (signature mauvaise) vs
    // credentials invalides (auth_key compromise / clé du wrong space).
    const securedData = `1|${credentials.userId}|${headers["x-mac-timestamp"]}|${method.toUpperCase()}|${path}`;
    console.error(
      `[PostFinance API] ${method} ${path} → HTTP ${res.status}`,
      JSON.stringify({
        response_body: text.slice(0, 500),
        sent_headers: {
          "x-mac-version": headers["x-mac-version"],
          "x-mac-userid": headers["x-mac-userid"],
          "x-mac-timestamp": headers["x-mac-timestamp"],
          "x-mac-value": headers["x-mac-value"].slice(0, 20) + "...",
        },
        securedData,
        auth_key_length: credentials.authKeyBase64.length,
        auth_key_first_8: credentials.authKeyBase64.slice(0, 8),
        auth_key_last_4: credentials.authKeyBase64.slice(-4),
        auth_key_trimmed_diff: credentials.authKeyBase64 !== credentials.authKeyBase64.trim()
          ? "WARN: auth_key has leading/trailing whitespace"
          : "ok",
      }),
    );
    throw new PfApiError(res.status, path, method, text);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
