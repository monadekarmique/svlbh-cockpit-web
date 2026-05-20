import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Registre LPD (Art. 31) · Compliance",
};
export const dynamic = "force-dynamic";

type Traitement = {
  id: string;
  reference: string;
  title: string;
  finalite: string;
  base_legale: string;
  personnes_concernees: string;
  categories_donnees: string;
  is_donnees_sensibles: boolean;
  donnees_sensibles_note: string | null;
  destinataires: string | null;
  sous_traitants: string[];
  transferts_etranger: string | null;
  duree_conservation: string;
  mesures_securite: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default async function RegistreLpdPage() {
  await requireOwner();

  const sb = await createClient();
  const { data, error } = await sb
    .from("compliance_traitement")
    .select("*")
    .order("reference", { ascending: true });

  const traitements = (data ?? []) as Traitement[];
  const active = traitements.filter((t) => t.is_active);
  const inactive = traitements.filter((t) => !t.is_active);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link href="/compliance" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Compliance
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner · Compliance
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          📑 Registre des activités de traitement (Art. 31 LPD)
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Conforme à la <strong>Loi fédérale sur la protection des données</strong>{" "}
          (LPD, RS 235.1, révisée 1<sup>er</sup> sept. 2023). Aligné sur les
          principes RGPD UE pour préparer l&apos;extension à Flavia (IT) en V2.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {active.length} traitement{active.length > 1 ? "s" : ""} actif{active.length > 1 ? "s" : ""}
          {inactive.length > 0 && ` · ${inactive.length} archivé${inactive.length > 1 ? "s" : ""}`}
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <strong>Erreur fetch :</strong> {error.message}
        </div>
      )}

      {/* Cadre doctrinal */}
      <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 text-xs leading-relaxed text-violet-900">
        <p className="font-bold uppercase tracking-wide text-violet-700">
          Cadrage doctrinal SVLBH
        </p>
        <p className="mt-1">
          Les <strong>vibrations transgénérationnelles</strong> (palette, VIFA,
          pierres, healing-path) ne sont pas des données de santé au sens de
          l&apos;Art. 5 let. c LPD ni Art. 9 §1 RGPD : ce sont des lectures
          radiesthésiques de mémoires ancestrales, sans diagnostic médical ni
          recommandation thérapeutique. Cadre documenté dans l&apos;ADR
          SVLBH-XX et confirmé par audit interne 2026-05-19.
        </p>
      </section>

      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Aucun traitement enregistré.
        </div>
      ) : (
        <ul className="space-y-4">
          {active.map((t) => (
            <TraitementCard key={t.id} t={t} />
          ))}
        </ul>
      )}

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Périmètre Patrick Bays (CH).</strong> V1 du registre LPD. À étendre
        pour les autres praticiennes certifiées : Flavia (IT — RGPD UE), Anne
        (CH), Cornelia (CH), etc. Chaque praticienne aura son propre registre
        adapté à sa juridiction via{" "}
        <code>praticienne_svlbh_id</code> dans la table{" "}
        <code>compliance_traitement</code>.
      </footer>
    </main>
  );
}

function TraitementCard({ t }: { t: Traitement }) {
  return (
    <li className="overflow-hidden rounded-xl border-2 border-neutral-200 bg-white">
      <details>
        <summary className="cursor-pointer p-4 hover:bg-neutral-50">
          <div className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <code className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-900">
              {t.reference}
            </code>
            <span className="font-bold text-blue-950">{t.title}</span>
            {t.is_donnees_sensibles ? (
              <span
                className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900"
                title="Données sensibles au sens Art. 5 let. c LPD"
              >
                ⚠ sensibles
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                ✓ non sensibles
              </span>
            )}
            <span className="ml-2 text-[11px] text-neutral-500">
              {t.sous_traitants.length} sous-traitant{t.sous_traitants.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            {t.finalite}
          </p>
        </summary>

        <div className="space-y-3 border-t border-neutral-200 bg-neutral-50/40 p-4 text-xs leading-relaxed">
          <Field label="Base légale (Art. 31 al. 1 LPD)">{t.base_legale}</Field>
          <Field label="Personnes concernées">{t.personnes_concernees}</Field>
          <Field label="Catégories de données">{t.categories_donnees}</Field>
          {t.is_donnees_sensibles ? (
            <Field label="⚠ Données sensibles — justification">
              {t.donnees_sensibles_note ?? "(non spécifié)"}
            </Field>
          ) : (
            t.donnees_sensibles_note && (
              <Field label="Note sur la non-sensibilité">
                {t.donnees_sensibles_note}
              </Field>
            )
          )}
          {t.destinataires && (
            <Field label="Destinataires internes">{t.destinataires}</Field>
          )}
          <Field label="Sous-traitants">
            <div className="flex flex-wrap gap-1.5 pt-1">
              {t.sous_traitants.length === 0 ? (
                <span className="italic text-neutral-400">Aucun</span>
              ) : (
                t.sous_traitants.map((st) => (
                  <span
                    key={st}
                    className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-900"
                  >
                    {st}
                  </span>
                ))
              )}
            </div>
          </Field>
          {t.transferts_etranger && (
            <Field label="Transferts à l'étranger">{t.transferts_etranger}</Field>
          )}
          <Field label="Durée de conservation">{t.duree_conservation}</Field>
          {t.mesures_securite && (
            <Field label="Mesures de sécurité (générales)">
              {t.mesures_securite}
            </Field>
          )}
          <p className="pt-2 text-[10px] text-neutral-400">
            Maj {new Date(t.updated_at).toLocaleDateString("fr-CH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · créé {new Date(t.created_at).toLocaleDateString("fr-CH")}
          </p>
        </div>
      </details>
    </li>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <div className="mt-0.5 text-neutral-800">{children}</div>
    </div>
  );
}
