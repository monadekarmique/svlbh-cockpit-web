// Parcours priv du jour — DEC Patrick 2026-05-10.
// Pour chaque certifiée du Cercle, affiche les clés chromatiques soin matinal
// du jour : la sienne (auto-soin) + celles de ses thérapeutes en soin (T4-T5)
// + en formation (T2-T3). Permet à Patrick de cocher = attacher la clé à la
// certifiée (workflow cascade Sprint A — répercussion vers ses propres
// certifiées prévue Sprint C).

import { createClient } from "@/lib/supabase/server";
import { AttachCheckbox } from "./attach-checkbox";

// Format renvoyé par la RPC get_parcours_cercle_du_jour (flat columns).
type CleRpcRow = {
  id: string;
  praticienne_svlbh_id: string;
  consultante_id: string | null;
  key_hex: string;
  session_label: string | null;
  created_at: string;
  consultante_first_name: string | null;
  consultante_last_name: string | null;
  consultante_parcours_stage: string | null;
};

// Format normalisé utilisé par les sub-views (avec consultante imbriquée).
type CleRow = {
  id: string;
  praticienne_svlbh_id: string;
  consultante_id: string | null;
  key_hex: string;
  session_label: string | null;
  created_at: string;
  consultante: {
    first_name: string;
    last_name: string;
    parcours_stage: string | null;
  } | null;
};

type CertifieeRow = {
  svlbh_id: string;
  first_name: string;
  last_name: string | null;
};

type AttachmentRow = {
  parcours_cle_id: string;
  certifiee_svlbh_id: string;
};

export async function ParcoursDuJourSection() {
  const supabase = await createClient();

  // 1. Certifiées du Cercle
  const { data: certifiees } = await supabase
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name")
    .eq("is_cercle_member", true)
    .order("first_name");

  if (!certifiees || certifiees.length === 0) {
    return null;
  }

  // 2. Toutes les clés du jour de TOUS les membres du Cercle.
  //    Bypass de la RLS cles_chrom_owner_rw via RPC SECURITY DEFINER —
  //    sinon le cockpit auth Patrick ne voit que ses propres clés.
  const { data: rpcRows } = await supabase.rpc("get_parcours_cercle_du_jour");

  // Normalise format RPC (flat) → format imbriqué utilisé par les sub-views.
  const allCles: CleRow[] = ((rpcRows ?? []) as CleRpcRow[]).map((r) => ({
    id: r.id,
    praticienne_svlbh_id: r.praticienne_svlbh_id,
    consultante_id: r.consultante_id,
    key_hex: r.key_hex,
    session_label: r.session_label,
    created_at: r.created_at,
    consultante:
      r.consultante_first_name !== null
        ? {
            first_name: r.consultante_first_name,
            last_name: r.consultante_last_name ?? "",
            parcours_stage: r.consultante_parcours_stage,
          }
        : null,
  }));

  // 3. Attachements existants
  const { data: attachments } = await supabase
    .from("parcours_attachment")
    .select("parcours_cle_id, certifiee_svlbh_id");

  const attachSet = new Set(
    (attachments ?? []).map(
      (a: AttachmentRow) => `${a.parcours_cle_id}::${a.certifiee_svlbh_id}`,
    ),
  );

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-bold tracking-tight text-blue-900">
          🌅 Parcours priv du jour
        </h2>
        <p className="text-xs text-neutral-600">
          Routines matinales de chaque certifiée + ses thérapeutes (formation
          ST2-ST3 / soin ST4-ST5). Cocher = attacher la clé à la certifiée
          (Sprint A — répercussion vers son sous-cercle prévue Sprint C).
        </p>
      </header>

      {(certifiees as CertifieeRow[]).map((cert) => {
        const own = allCles.filter(
          (k) =>
            k.praticienne_svlbh_id === cert.svlbh_id && k.consultante_id === null,
        );
        const therapeutesEnSoin = allCles.filter(
          (k) =>
            k.praticienne_svlbh_id === cert.svlbh_id &&
            k.consultante !== null &&
            ["t4", "t5"].includes(k.consultante.parcours_stage ?? ""),
        );
        const therapeutesEnFormation = allCles.filter(
          (k) =>
            k.praticienne_svlbh_id === cert.svlbh_id &&
            k.consultante !== null &&
            ["t2", "t3"].includes(k.consultante.parcours_stage ?? ""),
        );

        const totalCount =
          own.length + therapeutesEnSoin.length + therapeutesEnFormation.length;

        return (
          <article
            key={cert.svlbh_id}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <header className="mb-3 flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-neutral-900">
                {cert.first_name} {cert.last_name ?? ""}
              </h3>
              <span className="text-xs text-neutral-500">
                {totalCount} clé{totalCount > 1 ? "s" : ""} aujourd'hui
              </span>
            </header>

            <SubSection
              title="Auto-soin (sa propre clé)"
              cles={own}
              certifieeId={cert.svlbh_id}
              attachSet={attachSet}
              emptyText="Pas encore de routine matinale aujourd'hui."
            />
            <SubSection
              title="Thérapeutes en soin (ST4-ST5)"
              cles={therapeutesEnSoin}
              certifieeId={cert.svlbh_id}
              attachSet={attachSet}
              emptyText="Aucune clé pour thérapeutes en soin."
            />
            <SubSection
              title="Thérapeutes en formation (ST2-ST3)"
              cles={therapeutesEnFormation}
              certifieeId={cert.svlbh_id}
              attachSet={attachSet}
              emptyText="Aucune clé pour thérapeutes en formation."
            />
          </article>
        );
      })}
    </section>
  );
}

function SubSection({
  title,
  cles,
  certifieeId,
  attachSet,
  emptyText,
}: {
  title: string;
  cles: CleRow[];
  certifieeId: string;
  attachSet: Set<string>;
  emptyText: string;
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </p>
      {cles.length === 0 ? (
        <p className="mt-1 text-xs text-neutral-400">{emptyText}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {cles.map((k) => {
            const attached = attachSet.has(`${k.id}::${certifieeId}`);
            return (
              <li
                key={k.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-2 py-1.5"
              >
                <AttachCheckbox
                  parcoursCleId={k.id}
                  certifieeId={certifieeId}
                  initialAttached={attached}
                />
                <span
                  className="h-4 w-4 shrink-0 rounded ring-1 ring-black/10"
                  style={{ backgroundColor: k.key_hex }}
                  title={k.key_hex}
                />
                <span className="font-mono text-[11px]">{k.key_hex}</span>
                {k.consultante ? (
                  <span className="text-xs text-neutral-700">
                    · {k.consultante.first_name} {k.consultante.last_name}
                  </span>
                ) : null}
                <span className="ml-auto text-[10px] text-neutral-400">
                  {new Date(k.created_at).toLocaleTimeString("fr-CH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
