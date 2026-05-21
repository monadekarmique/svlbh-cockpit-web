// PostFinance Checkout — signature HMAC-SHA512 (MAC) pour authentification API.
// Spec : https://checkout.postfinance.ch/doc/api/web-service
// DEC Patrick 2026-05-21 (Brief dev v1 sandbox V3).
//
// L'auth PostFinance Checkout impose 4 headers calculés à chaque requête :
//   x-mac-version    "1"
//   x-mac-userid     <pf_app_user_id> (numérique, ex "170682")
//   x-mac-timestamp  <unix epoch en secondes>
//   x-mac-value      base64(HMAC-SHA512(secret, securedData))
//
// securedData = "version|userid|timestamp|METHOD|URL_PATH_AND_QUERY"
// secret = base64-decode(auth_key) — l'auth_key reçu de PF est déjà en base64.

import { createHmac } from "node:crypto";

export const MAC_VERSION = "1";

export type MacHeaders = {
  "x-mac-version": string;
  "x-mac-userid": string;
  "x-mac-timestamp": string;
  "x-mac-value": string;
};

export function signRequest({
  method,
  pathWithQuery,
  userId,
  authKeyBase64,
}: {
  method: string;
  /** Path + query, ex: "/api/webhook-listener/create?spaceId=96870" */
  pathWithQuery: string;
  userId: string;
  authKeyBase64: string;
}): MacHeaders {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const upperMethod = method.toUpperCase();
  const securedData = `${MAC_VERSION}|${userId}|${timestamp}|${upperMethod}|${pathWithQuery}`;
  const keyBuf = Buffer.from(authKeyBase64, "base64");
  const mac = createHmac("sha512", keyBuf).update(securedData, "utf8").digest("base64");
  return {
    "x-mac-version": MAC_VERSION,
    "x-mac-userid": userId,
    "x-mac-timestamp": timestamp,
    "x-mac-value": mac,
  };
}
