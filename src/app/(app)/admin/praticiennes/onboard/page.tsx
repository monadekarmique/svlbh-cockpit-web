// Onboarding PostFinance Checkout — form Owner ST6 only.
// DEC Patrick 2026-05-21 (Brief dev v1 sandbox V3 Anne / réutilisé Cornelia).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardPraticienne } from "./actions";

export const metadata: Metadata = { title: "Onboarding PostFinance" };
export const dynamic = "force-dynamic";

type Praticienne = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  code_praticien: number | null;
  stx: string | null;
  pf_environment: string | null;
  pf_onboarded_at: string | null;
  pf_space_id: string | null;
};

export default async function OnboardPraticiennePage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb
    .from("praticienne_profile")
    .select("stx")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  if (me?.stx !== "ST6") redirect("/dashboard");

  const { data: praticiennes } = await sb
    .from("praticienne_profile")
    .select(
      "svlbh_id, first_name, last_name, code_praticien, stx, pf_environment, pf_onboarded_at, pf_space_id",
    )
    .in("stx", ["ST3", "ST4", "ST5", "ST6"])
    .eq("pro_status", "ACTIVE")
    .order("code_praticien", { ascending: true, nullsFirst: false });

  const list = (praticiennes ?? []) as Praticienne[];

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Admin
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          🏦 Onboarding PostFinance Checkout
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Configure les credentials PostFinance Checkout d&apos;une praticienne
          + crée son webhook listener côté PF qui pointe vers le scenario
          Make.com #8998624. Données chiffrées via Vault Supabase
          (<code>praticienne_encryption_key</code>).
        </p>
      </header>

      {/* État actuel des praticiennes */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-700">
          État onboarding ({list.length} praticiennes ST3+)
        </h2>
        <ul className="mt-2 divide-y divide-neutral-100">
          {list.map((p) => (
            <li key={p.svlbh_id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
              <span className="font-semibold">
                {p.first_name} {p.last_name}
              </span>
              {p.code_praticien != null && (
                <span className="font-mono text-[10px] text-neutral-500">
                  #{String(p.code_praticien).padStart(5, "0")}
                </span>
              )}
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-900">
                {p.stx}
              </span>
              {p.pf_onboarded_at ? (
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  ✓ {p.pf_environment} · Space {p.pf_space_id ?? "—"}
                </span>
              ) : (
                <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                  ○ pas onboardée
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Form onboarding */}
      <section className="rounded-xl border-2 border-blue-300 bg-blue-50/40 p-5">
        <h2 className="text-base font-bold text-blue-950">
          Configurer les credentials PostFinance
        </h2>
        <p className="mt-1 text-xs text-blue-800">
          Les 4 valeurs viennent du portail PostFinance Merchant (Space → Settings →
          Application User). Une fois soumis : webhook créé côté PF, credentials
          chiffrés en DB, audit log tracé.
        </p>

        <form action={onboardPraticienne} className="mt-4 space-y-3">
          <Field
            label="Praticienne"
            name="svlbh_id"
            type="select"
            required
            options={[
              { value: "", label: "— choisir —" },
              ...list.map((p) => ({
                value: p.svlbh_id,
                label: `${p.first_name ?? ""} ${p.last_name ?? ""} (${p.stx}${p.code_praticien ? ` · #${p.code_praticien}` : ""})${p.pf_onboarded_at ? " ✓ déjà onboardée" : ""}`,
              })),
            ]}
          />

          <Field
            label="Environnement PostFinance"
            name="pf_environment"
            type="select"
            required
            defaultValue="sandbox"
            options={[
              { value: "sandbox", label: "🧪 Sandbox (test)" },
              { value: "production", label: "🔴 Production (paiements réels)" },
            ]}
          />

          <Field
            label="Space ID"
            name="pf_space_id"
            placeholder="ex: 96870"
            help="ID du Space PostFinance (numérique)."
            required
          />

          <Field
            label="Application User ID"
            name="pf_app_user_id"
            placeholder="ex: 170682"
            help="ID de l'Application User créé dans le Space PF."
            required
          />

          <Field
            label="Auth Key (MAC secret)"
            name="pf_auth_key"
            type="password"
            placeholder="ex: gfOrmn...07tCg="
            help="Secret HMAC-SHA512 base64 affiché UNE seule fois au moment de la création dans PF (à conserver ailleurs)."
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
            >
              🚀 Onboarder + créer webhook
            </button>
          </div>
        </form>
      </section>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Note V1.</strong> Le webhook URL pointe sur l&apos;env var{" "}
        <code>PF_MAKE_WEBHOOK_URL</code> (par défaut : scenario Make #8998624,
        hook.eu2.make.com). Si le scenario change, mettre à jour Render env
        vars. La clé maître de chiffrement <code>praticienne_encryption_key</code>{" "}
        est dans Vault Supabase — pas dans le code ni les env vars.
      </footer>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  help,
  required,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  type?: "text" | "password" | "select";
  placeholder?: string;
  help?: string;
  required?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {type === "select" ? (
        <select
          name={name}
          required={required}
          defaultValue={defaultValue}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm"
        >
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 font-mono text-sm"
          autoComplete="off"
        />
      )}
      {help && <span className="mt-0.5 block text-[10px] italic text-neutral-500">{help}</span>}
    </label>
  );
}
