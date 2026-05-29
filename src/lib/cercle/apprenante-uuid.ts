// Identifiant stable (UUIDv5) pour les apprenantes statiques (Julie, Sarah,
// Léa, etc.) qui n'ont pas d'svlbh_id dans praticienne_profile. Permet de
// stocker leurs attributions DESA dans la même table praticienne_desa_capacity
// que les therapeutes — l'UUID est déterministe à partir du nom, donc cohérent
// d'un rendu à l'autre. DEC Patrick 2026-05-29.

import { createHash } from "node:crypto";

// Namespace UUID arbitraire mais stable (DNS namespace standard, RFC 4122).
const NS_HEX = "6ba7b8109dad11d180b400c04fd430c8";

export function apprenanteSvlbhId(name: string): string {
  const ns = Buffer.from(NS_HEX, "hex");
  const h = createHash("sha1");
  h.update(ns);
  h.update("apprenante:" + name);
  const bytes = h.digest().subarray(0, 16);
  // Version 5 (name-based, SHA-1) + variant RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
