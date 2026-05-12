import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  await requireOwner();

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
        <p className="mt-1 text-sm text-neutral-600">
          DPIA, registre Art. 30 RGPD, journaux d&apos;audit, DPA Render &
          Supabase, archives consentements.
        </p>
      </header>
      <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
        Modules Compliance à construire (registre traitements, journaux RLS,
        archives consentements, exports DPIA, etc.).
      </section>
    </main>
  );
}
