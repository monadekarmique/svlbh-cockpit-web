"use client";

// Apprenantes — vue statique groupée par catégorie. Owner ST6 uniquement.
// DEC Patrick 2026-05-29 : drag-and-drop retiré (rendait le survol mobile
// impraticable et ne fonctionnait pas correctement). Pour changer un tier
// d'apprenante, éditer directement la table apprenante_tier en DB ou
// APPRENANTES dans shamanes.ts.
// DEC Patrick 2026-05-18 (legacy).

import { useState } from "react";
import { TIER_LABEL, TIER_COLOR } from "@/lib/cercle/shamanes";
import type { ParticipantTier } from "@/lib/cercle/shamanes";
import { lookupMembership } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership, Dhatu, DhatuMeta } from "@/lib/cercle/akashiques";
import type { DesaAtom } from "@/lib/cercle/desa";
import { DesaEditModal } from "./desa-edit-modal";
import { BdecGisantsModal } from "./bdec-gisants-modal";

export type DnDApprenante = {
  name: string;
  /** UUIDv5 déterministe (cf. apprenanteSvlbhId) — clé pour les
   *  attributions DESA. Pas un vrai svlbh_id en DB. */
  svlbh_id: string;
  tier: "st1-active" | "formation" | "parcours-passif" | "cercle-akashique";
  emoji?: string;
  description?: string | null;
  niveaux_bloques?: number | null;
  /** Champ legacy — conservé pour compatibilité, plus utilisé pour l'affichage. */
  desa_active?: boolean;
  /** Codes DESA accordés (capacité détenue). */
  desa_granted?: string[];
  /** Codes DESA marqués karmiques à libérer — affichés en rouge à gauche du
   *  sigle DESA sur le devant de la carte. DEC Patrick 2026-05-29. */
  desa_karmic?: string[];
  /** Pastilles affichées en colonne gauche (mêmes que sur cartes therapeute). */
  tx?: string;
  cx?: string;
  stx?: string;
  /** Annotations sortantes — cette personne pointe d'autres comme
   *  superviseurs/anchors. Rendus sur les cartes de ces autres, pas ici. */
  nsb_links?: Array<{ name: string; cercle?: string }>;
  /** Pastilles INCOMING — d'autres personnes pointent celle-ci comme
   *  superviseur/anchor (avec cercle optionnel). DEC Patrick 2026-05-29. */
  nsb_followers?: Array<{ name: string; cercle?: string }>;
  /** Pastille verte NSB familiales avec contexte. DEC Patrick 2026-05-29. */
  nsb_familial?: { count: number; description: string };
};

type ZoneKey = "st1-active" | "formation" | "parcours-passif" | "cercle-akashique";

const ZONES: Array<{ key: ZoneKey; emoji: string; title: string }> = [
  { key: "st1-active", emoji: "🌟", title: "Apprenantes ST1 actives" },
  { key: "formation", emoji: "🌱", title: "Apprenantes ST2 actives" },
  { key: "parcours-passif", emoji: "💤", title: "Shamanes passives de Cercles akashiques actifs" },
  { key: "cercle-akashique", emoji: "🌌", title: "Shamanes du Cercle akashique ex-Shamanes passives" },
];

function CerclesAkashiquesChips({
  membership,
  dhatuMeta,
}: {
  membership: AkashiqueMembership | null;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
}) {
  if (!membership) return null;
  const all = [
    ...membership.membres.map((c) => ({ c, isFormation: false })),
    ...membership.formation.map((c) => ({ c, isFormation: true })),
  ];
  if (all.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {all.map(({ c, isFormation }) => {
        const primary = c.dhatus[0];
        const meta = dhatuMeta[primary];
        if (!meta) return null;
        return (
          <span
            key={c.name}
            className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              borderColor: meta.color,
              color: meta.color,
              backgroundColor: isFormation ? "transparent" : `${meta.color}10`,
              opacity: isFormation ? 0.7 : 1,
              borderStyle: isFormation ? "dashed" : "solid",
            }}
          >
            {c.dhatus.map((d) => dhatuMeta[d]?.emoji ?? "").join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

export function ApprenantesDnD({
  initial,
  dhatuMeta,
  desaCatalog,
}: {
  initial: DnDApprenante[];
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
}) {
  // Rendu statique : items = initial sans state local. Le drag inter-zones
  // n'est plus nécessaire (DEC Patrick 2026-05-29).
  return (
    <div className="space-y-5 pt-2">
      <p className="text-[10px] font-normal text-neutral-500">
        🔒 Vue Owner — non visible aux thérapeutes.
      </p>
      {ZONES.map((z) => {
        const c = TIER_COLOR[z.key as ParticipantTier];
        const inZone = initial.filter((it) => it.tier === z.key);
        return (
          <section key={z.key} className="space-y-2">
            <h2 className="text-base font-semibold" style={{ color: c }}>
              {z.emoji} {z.title} ({inZone.length})
            </h2>
            <div className="rounded-xl p-2">
              {inZone.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs italic text-neutral-500">
                  Aucune apprenante.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inZone.map((a) => (
                    <li key={a.name}>
                      <ApprenanteCardInner
                        a={a}
                        color={c}
                        dhatuMeta={dhatuMeta}
                        desaCatalog={desaCatalog}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ApprenanteCardInner({
  a,
  color,
  dhatuMeta,
  desaCatalog,
}: {
  a: DnDApprenante;
  color: string;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
}) {
  const memb = lookupMembership(a.name);
  const [desaOpen, setDesaOpen] = useState(false);
  const [bdecOpen, setBdecOpen] = useState(false);

  // BDEC = système parallèle clone de DESA (consciences gisantes vertes,
  // 4 codes DEII/EP/Des/Dra). Ses codes karmiques s'affichent dans la
  // rangée VERTE au-dessus de la rangée rouge DESA. DEC Patrick 2026-05-29.
  const bdecCodes = new Set(
    Object.values(desaCatalog)
      .filter((c) => c.system === "BDEC")
      .map((c) => c.code),
  );
  const desaKarmic = (a.desa_karmic ?? []).filter((c) => !bdecCodes.has(c));
  const bdecKarmic = (a.desa_karmic ?? []).filter((c) => bdecCodes.has(c));
  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      {(a.tx || a.cx || a.stx) ? (
        <div className="flex flex-col gap-0.5 font-mono text-[9px] font-bold">
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900" title="Tx — capacité à recevoir / risque">
            {a.tx ?? "T?"}
          </span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900" title="Cx — capacité à transmettre">
            {a.cx ?? "C?"}
          </span>
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-900" title="ST — parcours / rôle">
            {a.stx ?? "ST?"}
          </span>
        </div>
      ) : (
        <span className="text-2xl">{a.emoji ?? "·"}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-neutral-900">{a.name}</p>
          {/* Section apprenantes = Owner-only (page-level gate). DESA toujours
              rendu (outil admin). Codes karmiques en rouge, max 3 par ligne
              avec retour à la ligne. DESA sigle à la fin de la dernière ligne. */}
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            {a.niveaux_bloques != null ? (
              <span
                className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-900"
                title="NSB — Niveaux Shamaniques Bloqués (apprenante_tier.niveaux_bloques)"
              >
                NSB {a.niveaux_bloques}
              </span>
            ) : null}
            {/* BDEC — clone parallèle de DESA, thème vert (consciences
                gisantes). Rangée(s) AU-DESSUS de DESA. DEC Patrick 2026-05-29. */}
            {(() => {
              const chunks: string[][] = [];
              for (let i = 0; i < bdecKarmic.length; i += 3) {
                chunks.push(bdecKarmic.slice(i, i + 3));
              }
              const bdecButton = (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBdecOpen(true);
                  }}
                  className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900 transition hover:ring-2 hover:ring-emerald-300"
                  title="Attribuer les capacités BDEC — consciences gisantes (Owner)"
                >
                  BDEC
                </button>
              );
              if (chunks.length === 0) return bdecButton;
              return chunks.map((row, idx) => (
                <div key={`bdec-${idx}`} className="flex items-center gap-1">
                  {row.map((code) => (
                    <span
                      key={code}
                      className="rounded-md border-2 border-emerald-500 bg-emerald-50 px-1 py-0.5 font-mono text-[10px] font-bold text-emerald-700"
                      title={`${code} — conscience gisante BDEC karmique à apaiser`}
                    >
                      {code}
                    </span>
                  ))}
                  {idx === 0 ? bdecButton : null}
                </div>
              ));
            })()}
            {/* DESA — système d'origine, thème rouge (Dark Entities & Spirit
                Attachments). Codes karmiques en rouge, max 3 par ligne. */}
            {(() => {
              const chunks: string[][] = [];
              for (let i = 0; i < desaKarmic.length; i += 3) {
                chunks.push(desaKarmic.slice(i, i + 3));
              }
              const desaButton = (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDesaOpen(true);
                  }}
                  className="rounded-md bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-900 transition hover:ring-2 hover:ring-indigo-300"
                  title="Attribuer les capacités DESA (Owner)"
                >
                  DESA
                </button>
              );
              if (chunks.length === 0) return desaButton;
              return chunks.map((row, idx) => (
                <div key={`desa-${idx}`} className="flex items-center gap-1">
                  {row.map((code) => (
                    <span
                      key={code}
                      className="rounded-md border-2 border-red-500 bg-red-50 px-1 py-0.5 font-mono text-[10px] font-bold text-red-600"
                      title={`${code} — DESA karmique encore à libérer`}
                    >
                      {code}
                    </span>
                  ))}
                  {idx === 0 ? desaButton : null}
                </div>
              ));
            })()}
          </div>
        </div>
        <p className="mt-0.5 text-[11px] font-semibold" style={{ color }}>
          {TIER_LABEL[a.tier as ParticipantTier]}
        </p>
        <CerclesAkashiquesChips membership={memb} dhatuMeta={dhatuMeta} />
        {/* NSB famille — pastille verte autonome (branche transgén propre).
            Placée juste après les cercles akashiques pour s'afficher sous
            la pastille Māṁsa (ou autre cercle pertinent) côté Julie/Léa,
            ou sous la zone cercles (vide) pour Carine. DEC Patrick 2026-05-29. */}
        {a.nsb_familial ? (
          <div className="mt-1.5 flex flex-col gap-0.5">
            <p className="text-[10px] font-medium text-emerald-700">
              {a.nsb_familial.description}
            </p>
            <span
              className="inline-flex w-fit items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700"
              title={`NSB famille — ${a.nsb_familial.description}`}
            >
              NSB famille · {a.nsb_familial.count}
            </span>
          </div>
        ) : null}
        {a.description ? (
          <p className="mt-1.5 text-[10px] italic text-neutral-600">{a.description}</p>
        ) : null}
        {/* Pastilles NSB INCOMING : Carine a-t-elle pointé cette personne
            comme superviseur/anchor ? Si oui, on affiche une mini-pastille
            par lien (avec contexte cercle si fourni). */}
        {(a.nsb_followers ?? []).length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(a.nsb_followers ?? []).map((follower, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-700"
                title={
                  follower.cercle
                    ? `NSB de relation avec ${follower.name} (cercle ${follower.cercle})`
                    : `NSB de relation avec ${follower.name}`
                }
              >
                NSB · {follower.name}
                {follower.cercle ? (
                  <span className="font-normal text-rose-500">· {follower.cercle}</span>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <DesaEditModal
        open={desaOpen}
        onClose={() => setDesaOpen(false)}
        svlbhId={a.svlbh_id}
        praticienneName={a.name}
        initialGranted={a.desa_granted ?? []}
        initialKarmic={a.desa_karmic ?? []}
        catalog={desaCatalog}
      />
      <BdecGisantsModal
        open={bdecOpen}
        onClose={() => setBdecOpen(false)}
        svlbhId={a.svlbh_id}
        praticienneName={a.name}
        initialGranted={a.desa_granted ?? []}
        initialKarmic={a.desa_karmic ?? []}
        catalog={desaCatalog}
      />
    </div>
  );
}
