import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-4">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Cockpit
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-blue-950">
        Shamanes
      </h1>
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm text-neutral-700">⏳ Module en cours de portage</p>
        <p className="mt-1 text-xs text-neutral-500">
          Source : ~/Developer/svlbh-cercle-de-lumiere (iOS native, 87 fichiers Swift)
        </p>
      </div>
    </div>
  );
}
