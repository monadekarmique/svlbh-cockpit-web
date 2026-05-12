import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireOwner();

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Gestion des comptes praticiennes, attributions de stage et
          révocations.
        </p>
      </header>
      <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
        Modules Admin à construire (gestion stx praticiennes, révocation,
        whitelist cockpit_access, etc.).
      </section>
    </main>
  );
}
