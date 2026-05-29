"use client";

// Carte thérapeute (extraite de page.tsx en client component pour le DnD).
// DEC Patrick 2026-05-18.

import { useState } from "react";
import { setMyDailyStatus } from "./daily-status-actions";
import { setGuidesLumiereAbsolute } from "./gl-action";
import { setTherapeuteNSB } from "./nsb-action";
import { addApprenanteCachee, removeApprenanteCachee, setApprenanteCacheeCount } from "./apprenante-cachee-action";
import { ApprenanteCacheeCard, type CacheeData } from "./apprenante-cachee-card";
import type { AkashiqueMembership, Dhatu, DhatuMeta } from "@/lib/cercle/akashiques";
import type { DnDTherapeute } from "./therapeutes-dnd-zones";
import { DYNAMIQUE_AXIS_TONE, type DynamiqueChip } from "@/lib/cercle/dynamiques";
import type { DesaAtom } from "@/lib/cercle/desa";
import { DesaEditModal } from "./desa-edit-modal";

// DESA — Dark Entities & Spirit Attachments. Bloc top-right de la carte
// (sous NSB). Affiche le sigle DESA si `desa_active=true`, suivi des chips
// des capacités précises accordées (DC/TFEC/ES/SEI/ILSS/DR/RI/BDEC) — vides
// tant que Patrick n'a pas attribué. DEC Patrick 2026-05-29.
function DesaBlock({
  onOpenEdit,
}: {
  onOpenEdit?: () => void;
}) {
  // DESA = outil admin Owner uniquement (DEC Patrick 2026-05-29 :
  // « visible pour les membres du cercle ... mais en non visible »).
  // Rendu uniquement quand l'Owner peut éditer ; pour tout autre user,
  // rien n'apparaît sur la carte. Les codes (DC/TFEC/…) ne sont jamais
  // affichés inline — uniquement dans le modal d'attribution.
  if (!onOpenEdit) return null;
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpenEdit();
      }}
      className="rounded-md bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-900 transition hover:ring-2 hover:ring-indigo-300"
      title="Attribuer les capacités DESA (Owner)"
    >
      DESA
    </button>
  );
}

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
            title={
              isFormation
                ? `Cercle ${c.name} — en formation (lignée actuelle)`
                : `Cercle ${c.name} — membre (incarnations passées)`
            }
          >
            {c.dhatus.map((d) => dhatuMeta[d]?.emoji ?? "").join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

function DynamiquesChips({ dynamiques }: { dynamiques: DynamiqueChip[] }) {
  if (!dynamiques || dynamiques.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {dynamiques.map((d) => {
        const tone = d.axis_mtc
          ? DYNAMIQUE_AXIS_TONE[d.axis_mtc]
          : DYNAMIQUE_AXIS_TONE.MULTI;
        return (
          <span
            key={d.id}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}
            title={`Dynamique : ${d.name}`}
          >
            {d.icon ? <span aria-hidden>{d.icon}</span> : null}
            <span>{d.short_code}</span>
          </span>
        );
      })}
    </div>
  );
}

export function TherapeuteCardClient({
  t, isMe, isOwner, dynamiques = [], membership = null, dhatuMeta, desaCatalog, desaGranted = [], desaKarmic = [], nsbFollowers = [], bumpGL,
  cachees = [], canWriteCachees = false,
}: {
  t: DnDTherapeute;
  isMe: boolean;
  isOwner: boolean;
  dynamiques?: DynamiqueChip[];
  membership?: AkashiqueMembership | null;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
  desaCatalog: Record<string, DesaAtom>;
  desaGranted?: string[];
  desaKarmic?: string[];
  nsbFollowers?: Array<{ name: string; cercle?: string }>;
  bumpGL?: (svlbhId: string, delta: 1 | -1) => void;
  /** Apprenantes cachées hébergées par cette thérapeute. */
  cachees?: CacheeData[];
  /** Owner OR membre du Cercle SR : peut créer/supprimer/éditer des cachées. */
  canWriteCachees?: boolean;
}) {
  const targetStatusOnToggle = t.status === "active" ? "hidden" : "active";
  const toggleLabel = t.status === "active" ? "Me cacher aujourd'hui" : "Redevenir active";

  const stickerStyle: React.CSSProperties = {
    borderLeftColor: "#cbd5e1", borderLeftWidth: 4,
  };

  const displayName = `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || "—";

  // Modal d'attribution des capacités DESA — Owner ST6 uniquement.
  const [desaOpen, setDesaOpen] = useState(false);
  // Édition inline du GL (saisie absolue Owner-only).
  const [glEditing, setGlEditing] = useState(false);
  // Édition inline du NSB (Owner-only).
  const [nsbEditing, setNsbEditing] = useState(false);
  // Édition inline du compteur Cachées (Owner ou Cercle SR).
  const [cacheesEditing, setCacheesEditing] = useState(false);

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm"
      style={stickerStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="flex flex-col gap-0.5 font-mono text-[9px] font-bold">
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900" title="Tx — capacité à recevoir / risque">
              {t.tx ?? "T?"}
            </span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900" title="Cx — capacité à transmettre">
              {t.capacity_anchor ? t.capacity_anchor.replace(/^T/, "C") : "C?"}
            </span>
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-900" title="ST — parcours / rôle">
              {t.stx ?? "ST?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neutral-900">
              {displayName}
              {isMe ? <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-900">moi</span> : null}
              {t.cercle_lumiere_sr ? <span className="ml-1 text-[10px]" title="Cercle SR">◉</span> : null}
            </p>
            {t.code_praticien != null ? (
              <p className="font-mono text-[10px] text-neutral-400">
                #{String(t.code_praticien).padStart(5, "0")}
              </p>
            ) : null}
            <CerclesAkashiquesChips membership={membership} dhatuMeta={dhatuMeta} />
            <DynamiquesChips dynamiques={dynamiques} />
            {nsbFollowers.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {nsbFollowers.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-700"
                    title={
                      f.cercle
                        ? `NSB de relation avec ${f.name} (cercle ${f.cercle})`
                        : `NSB de relation avec ${f.name}`
                    }
                  >
                    NSB · {f.name}
                    {f.cercle ? (
                      <span className="font-normal text-rose-500">· {f.cercle}</span>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Colonne top-right : NSB (si présent, tous les users) + sigle DESA
            (Owner only — outil admin). DEC Patrick 2026-05-29. */}
        {(t.attention_steps != null || isOwner) ? (
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            {/* NSB éditable inline (Owner only). Non-Owner voit la chip
                read-only si valeur présente, rien sinon. DEC Patrick 2026-05-29. */}
            {isOwner ? (
              nsbEditing ? (
                <form
                  action={setTherapeuteNSB}
                  onSubmit={() => setNsbEditing(false)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <input type="hidden" name="svlbh_id" value={t.svlbh_id} />
                  <input
                    type="number"
                    name="value"
                    defaultValue={t.attention_steps ?? ""}
                    min={0}
                    autoFocus
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setNsbEditing(false);
                      }
                    }}
                    className="w-16 rounded-full border border-rose-400 bg-rose-50 px-2 py-0.5 text-center font-mono text-[11px] font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    placeholder="NSB"
                  />
                  <button type="submit" className="sr-only" tabIndex={-1}>
                    Sauver
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNsbEditing(true);
                  }}
                  className={
                    "rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold transition hover:ring-2 hover:ring-rose-300 " +
                    (t.attention_steps != null
                      ? "border-rose-300 bg-rose-50 text-rose-900"
                      : "border-dashed border-rose-200 bg-white text-rose-400")
                  }
                  title="Cliquer pour saisir / modifier le NSB (vide = retire l'override)"
                >
                  NSB {t.attention_steps ?? "+"}
                </button>
              )
            ) : t.attention_steps != null ? (
              <span
                className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-900"
                title="NSB — Niveaux Shamaniques Bloqués"
              >
                NSB {t.attention_steps}
              </span>
            ) : null}
            {/* Codes karmiques (rouges) — max 3 par ligne avec retour à la
                ligne. DESA sigle à la fin de la dernière ligne (ou seul si
                aucun code karmique). DEC Patrick 2026-05-29. */}
            {(() => {
              const chunks: string[][] = [];
              for (let i = 0; i < desaKarmic.length; i += 3) {
                chunks.push(desaKarmic.slice(i, i + 3));
              }
              const desa = (
                <DesaBlock
                  onOpenEdit={isOwner ? () => setDesaOpen(true) : undefined}
                />
              );
              if (chunks.length === 0) return desa;
              // DESA reste ancré sur la 1ʳᵉ ligne (haut de la carte) ; les
              // chunks suivants alignent par-dessous via un placeholder
              // invisible occupant la place de DESA. DEC Patrick 2026-05-29.
              return chunks.map((row, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  {row.map((code) => (
                    <span
                      key={code}
                      className="rounded-md border-2 border-red-500 bg-red-50 px-1 py-0.5 font-mono text-[10px] font-bold text-red-600"
                      title={`${code} — DESA karmique encore à libérer`}
                    >
                      {code}
                    </span>
                  ))}
                  {idx === 0 ? (
                    desa
                  ) : (
                    <span
                      aria-hidden
                      className="invisible rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold"
                    >
                      DESA
                    </span>
                  )}
                </div>
              ));
            })()}
          </div>
        ) : null}
      </div>

      {isMe ? (
        <form action={setMyDailyStatus} onPointerDown={(e) => e.stopPropagation()}>
          <input type="hidden" name="status" value={targetStatusOnToggle} />
          <button
            type="submit"
            onPointerDown={(e) => e.stopPropagation()}
            className={
              "w-full rounded-md px-2 py-1 text-[11px] font-semibold transition " +
              (targetStatusOnToggle === "hidden"
                ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200")
            }
          >
            {toggleLabel}
          </button>
        </form>
      ) : null}

      {/* Rangée bas de carte : compteur "Apprenant.e.s cachées" à gauche
          (clone GL pour les sous-cartes) + compteur GL collaboratif à droite.
          DEC Patrick 2026-05-29. */}
      <div
        className="flex items-center justify-between gap-2 pt-1"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Apprenant.e.s cachées · compteur · +/- (Owner ou Cercle SR). */}
        <div
          className="flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {canWriteCachees && cachees.length > 0 ? (
            <form
              action={removeApprenanteCachee}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="id" value={cachees[cachees.length - 1].id} />
              <button
                type="submit"
                onPointerDown={(e) => e.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-600 transition hover:bg-rose-50 hover:text-rose-600"
                title="Retirer la dernière apprenante cachée"
              >
                −
              </button>
            </form>
          ) : null}
          {/* Pastille Cachées — click-to-edit pour saisir un compteur
              absolu (clone GL). DEC Patrick 2026-05-29. */}
          {canWriteCachees && cacheesEditing ? (
            <form
              action={setApprenanteCacheeCount}
              onSubmit={() => setCacheesEditing(false)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="host_svlbh_id" value={t.svlbh_id} />
              <input
                type="number"
                name="count"
                defaultValue={cachees.length}
                min={0}
                autoFocus
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setCacheesEditing(false);
                  }
                }}
                className="w-16 rounded-full bg-neutral-100 px-2 py-0.5 text-center font-mono text-[11px] font-bold text-neutral-900 ring-1 ring-neutral-400 focus:outline-none focus:ring-2"
              />
              <button type="submit" className="sr-only" tabIndex={-1}>
                Sauver
              </button>
            </form>
          ) : canWriteCachees ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setCacheesEditing(true);
              }}
              className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-700 transition hover:ring-2 hover:ring-neutral-300"
              title="Cliquer pour saisir un nombre exact de cachées"
            >
              🫥 Cachées · {cachees.length}
            </button>
          ) : (
            <span
              className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-700"
              title="Apprenant.e.s cachées hébergées sur cette carte"
            >
              🫥 Cachées · {cachees.length}
            </span>
          )}
          {canWriteCachees ? (
            <form
              action={addApprenanteCachee}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="host_svlbh_id" value={t.svlbh_id} />
              <button
                type="submit"
                onPointerDown={(e) => e.stopPropagation()}
                className="flex h-5 w-5 items-center justify-center rounded border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-50"
                title="Ajouter une apprenante cachée"
              >
                +
              </button>
            </form>
          ) : null}
        </div>
        {/* GL — Guides de Lumière collaboratif. */}
        <div
          className="flex items-center justify-end"
          onPointerDown={(e) => e.stopPropagation()}
        >
        <div
          className="flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={!bumpGL || (t.guides_lumiere ?? 0) === 0}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              bumpGL?.(t.svlbh_id, -1);
            }}
            className="flex h-5 w-5 items-center justify-center rounded border border-violet-200 bg-white text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30"
            title="−1 GL"
          >
            −
          </button>
          {isOwner && glEditing ? (
            <form
              action={setGuidesLumiereAbsolute}
              // onSubmit ferme l'édition APRÈS dispatch de l'action serveur.
              // Avec un bouton submit caché + handler Enter explicite,
              // requestSubmit() est garanti d'invoquer l'action côté React.
              onSubmit={() => setGlEditing(false)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="svlbh_id" value={t.svlbh_id} />
              <input
                type="number"
                name="value"
                defaultValue={t.guides_lumiere ?? 0}
                min={0}
                autoFocus
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Enter explicite : requestSubmit() déclenche action +
                    // onSubmit (fermeture). Sans ce handler, Enter peut ne
                    // pas soumettre selon la version React/browser.
                    // DEC Patrick 2026-05-29.
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setGlEditing(false);
                  }
                }}
                className="w-20 rounded-full bg-violet-50 px-2 py-0.5 text-center font-mono text-[11px] font-bold text-violet-900 ring-1 ring-violet-400 focus:outline-none focus:ring-2"
              />
              {/* Submit caché — ceinture+bretelles pour garantir que Enter
                  soumette le form même si onKeyDown rate. */}
              <button type="submit" className="sr-only" tabIndex={-1}>
                Sauver
              </button>
            </form>
          ) : isOwner ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setGlEditing(true);
              }}
              className="rounded-full bg-violet-100 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-900 transition hover:ring-2 hover:ring-violet-300"
              title="Cliquer pour saisir une valeur GL absolue (Owner)"
            >
              GL {t.guides_lumiere ?? 0}
            </button>
          ) : (
            <span
              className="rounded-full bg-violet-100 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-900"
              title="Guides de Lumière — compteur collaboratif (modifiable par tout membre du Cercle)"
            >
              GL {t.guides_lumiere ?? 0}
            </span>
          )}
          <button
            type="button"
            disabled={!bumpGL}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              bumpGL?.(t.svlbh_id, 1);
            }}
            className="flex h-5 w-5 items-center justify-center rounded border border-violet-200 bg-white text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-30"
            title="+1 GL"
          >
            +
          </button>
        </div>
        </div>
      </div>

      {/* Liste des apprenantes cachées hébergées par cette thérapeute.
          Une mini-card par row, DESA + BDEC + rôle éditables. */}
      {cachees.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1">
          {cachees.map((c) => (
            <ApprenanteCacheeCard
              key={c.id}
              cachee={c}
              hostName={displayName}
              desaCatalog={desaCatalog}
              canWrite={canWriteCachees}
            />
          ))}
        </div>
      ) : null}

      <DesaEditModal
        open={desaOpen}
        onClose={() => setDesaOpen(false)}
        svlbhId={t.svlbh_id}
        praticienneName={displayName}
        initialGranted={desaGranted}
        initialKarmic={desaKarmic}
        catalog={desaCatalog}
      />
    </div>
  );
}
