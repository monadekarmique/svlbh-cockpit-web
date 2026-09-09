import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Versions du modèle" };
export const dynamic = "force-dynamic";

// DEC Patrick 09.09.2026 : « c'est notre version v0.8.1 », puis les itérations.
// Les versions sont FIGÉES en base (modele_version, update/delete révoqués) :
// une version qu'on réécrit ne permet plus de savoir si un chiffre a changé
// parce que la réalité a bougé ou parce que quelqu'un l'a corrigé.
//
// ⚠️ CETTE PAGE MONTRE AUSSI « CE QUI RESTE OUVERT ». C'est la partie qui aura
// le plus de valeur dans six mois — les paramètres, eux, seront périmés.

type Version = {
  version: string; fige_le: string; fige_par: string;
  parametres: Record<string, Record<string, unknown>>;
  ouvert: string | null; note: string | null;
};


export default async function VersionsPage() {
  await requireSt6();
  const supabase = await createClient();
  const { data, error } = await supabase.from("modele_version").select("*");

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Versions du modèle</h1>
        <p className="mt-4 rounded-lg bg-rose-50 p-4 text-rose-900">{error.message}</p>
      </main>
    );
  }
  // ⚠️ Revue du 09.09 soir : `order by version` triait un TEXT — v0.8.10 tombait
  // sous v0.8.2 et v0.10 passait dernière. Tri sémantique ici.
  const semver = (v: string) => v.replace(/^v/, "").split(".").map((x) => Number(x) || 0);
  const versions = ((data ?? []) as Version[]).sort((a, b) => {
    const [x, y] = [semver(a.version), semver(b.version)];
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const d = (y[i] ?? 0) - (x[i] ?? 0); if (d) return d;
    }
    return 0;
  });
  // Diff générique clé/valeur entre versions consécutives — la table comparative
  // imprimait des littéraux (« 72 % », 5 023, « 15 ») au lieu des paramètres figés :
  // deux transitions sur trois n'affichaient AUCUN changement.
  const aplatir = (o: unknown, prefix = ""): Record<string, string> => {
    const out: Record<string, string> = {};
    if (o && typeof o === "object" && !Array.isArray(o)) {
      for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
        Object.assign(out, aplatir(v, prefix ? `${prefix}.${k}` : k));
      }
    } else out[prefix] = typeof o === "string" ? o : JSON.stringify(o);
    return out;
  };
  const diffs = versions.map((v, i) => {
    const prev = versions[i + 1];
    if (!prev) return { version: v.version, changes: [] as [string, string | undefined, string][] };
    const a = aplatir(prev.parametres), b = aplatir(v.parametres);
    const changes: [string, string | undefined, string][] = [];
    for (const k of Object.keys(b)) if (a[k] !== b[k]) changes.push([k, a[k], b[k]]);
    return { version: v.version, changes };
  });

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Versions du modèle économique</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Chaque version est figée : on ne la réécrit pas, on en crée une nouvelle.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Ce qui change d’une version à l’autre</h2>
        <p className="text-sm text-neutral-600">
          Calculé depuis les paramètres figés — chaque clé qui diffère de la version précédente.
        </p>
        {diffs.map((d) => (
          <div key={d.version} className="rounded-lg border border-neutral-200">
            <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2 text-sm font-medium">
              {d.version}{" "}
              <span className="font-normal text-neutral-500">
                — {d.changes.length === 0 ? "première version, ou aucun paramètre changé" : `${d.changes.length} paramètre(s)`}
              </span>
            </div>
            {d.changes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-xs">
                  <tbody className="divide-y divide-neutral-100">
                    {d.changes.map(([k, av, ap]) => (
                      <tr key={k}>
                        <td className="px-3 py-1.5 font-mono text-neutral-600">{k}</td>
                        <td className="px-3 py-1.5 text-neutral-400 line-through">{av ?? "—"}</td>
                        <td className="px-3 py-1.5 font-medium">{ap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </section>

      {versions.map((v) => (
        <section key={v.version} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">{v.version}</h2>
            <span className="text-xs text-neutral-500">
              figée le {new Date(v.fige_le).toLocaleDateString("fr-CH")} · {v.fige_par}
            </span>
          </div>
          {v.note && (
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-700">
              {v.note}
            </pre>
          )}
          {v.ouvert && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-800">
                Ce qui restait ouvert
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-amber-900">
                {v.ouvert}
              </pre>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
