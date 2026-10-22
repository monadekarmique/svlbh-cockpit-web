import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import type { Resume } from "./actions";
import { ResumesClient } from "./resumes-client";

export const metadata: Metadata = { title: "Résumés à relire" };
export const dynamic = "force-dynamic";

// Patrick, 21.10.2026 : « Oui, on construit » (carte d5a25199) ; 23.10 à 01h3x : « oui pour ta question avant tu la
// construis » — une page où il relit chaque brouillon « Ce que tu as manqué » et le publie, tel quel ou corrigé.
// Lecture : abo_resume_jour (la base ne rend les brouillons qu'à Patrick, is_owner_st6). Les brouillons d'abord, puis les
// 14 derniers jours déjà relus, pour pouvoir y revenir.

export default async function ResumesAboPage() {
  await requireSt6();
  const sb = await createClient();
  const { data, error } = await sb
    .from("abo_resume_jour")
    .select("groupe_id, jour, texte, statut, ecrit_le, relu_le, source_ids, abo_groupe(nom)")
    .order("jour", { ascending: false })
    .limit(200);
  const tous = (data ?? []) as unknown as Resume[];
  const brouillons = tous.filter((r) => r.statut === "brouillon");
  const relus = tous.filter((r) => r.statut === "relu").slice(0, 40);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Résumés à relire — « Ce que tu as manqué »</h1>
      <p className="mt-1 text-sm text-gray-600">
        Un résumé par groupe Abo et par jour, écrit la nuit depuis les messages du groupe. Toi seul vois les brouillons ; une fois
        publié, il s’affiche aux membres du groupe dans Priv-1, en tête du jour.
      </p>
      {error ? <p className="mt-3 text-sm text-red-700">Lecture refusée : {error.message}</p> : null}
      <ResumesClient brouillons={brouillons} relus={relus} />
    </div>
  );
}
