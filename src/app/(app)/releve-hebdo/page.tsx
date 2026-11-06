import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";
import type { Groupe } from "./actions";
import { GroupesClient } from "./groupes-client";

export const metadata: Metadata = { title: "Relevé du lundi" };
export const dynamic = "force-dynamic";

// Carte 142fc42c : « sur /releve-hebdo, une section « Groupes découverts » ; un clic sur « Inscrire » appelle inscrire_groupe
// et affiche « inscrit · N membres ajoutées » ; « Écarter » retire la ligne ».
// Patrick, 20.10.2026 sur le relevé du 19.10 : « Je tranche écart par écart : dis lesquels ».
// Lecture : groupe_decouvert (propriétaire seul), ni inscrit ni écarté. Ceux que seul z5 voit — le téléphone de Cornelia — sont
// à part : ils ne sont pas des groupes de Patrick.
// Patrick, 04.11.2026 : « C'est pas clair et les mêmes choses reviennent tous les lundis » (carte ac4ca1b5). D'abord les groupes
// DÉCOUVERTS depuis le relevé précédent — les mêmes que la carte du lundi ; ceux qui étaient déjà là sont repliés, comptés.

export default async function ReleveHebdoPage() {
  await requireSt6();
  const sb = await createClient();
  const { data, error } = await sb
    .from("groupe_decouvert")
    .select("groupe_jid, nom, bridges, participants, messages_30j, patrick_ecrit, dernier_message, decouvert_le")
    .is("inscrit_le", null)
    .is("ecarte_le", null);
  const tous = ((data ?? []) as Groupe[]).sort(
    (a, b) => Number(!!b.patrick_ecrit) - Number(!!a.patrick_ecrit) || (b.messages_30j ?? 0) - (a.messages_30j ?? 0),
  );
  const z5Seul = (g: Groupe) => (g.bridges ?? []).length > 0 && (g.bridges ?? []).every((p) => p === "z5");
  const siens = tous.filter((g) => !z5Seul(g));
  const cornelia = tous.filter(z5Seul);
  const { data: rel } = await sb.from("releve_hebdo").select("semaine, genere_le, nb_ecarts")
    .eq("simulation", false).order("genere_le", { ascending: false }).limit(2);
  const dernier = rel?.[0] as { semaine: string; genere_le: string; nb_ecarts: number } | undefined;
  const avant = rel?.[1] as { genere_le: string } | undefined;
  // « Nouveau » = découvert après le relevé qui précède le dernier (la carte du lundi liste les mêmes).
  const depuis = avant?.genere_le ?? (dernier ? new Date(new Date(dernier.genere_le).getTime() - 7 * 86_400_000).toISOString() : null);
  const estNouveau = (g: Groupe) => !depuis || (!!g.decouvert_le && new Date(g.decouvert_le) > new Date(depuis));
  const nouveaux = siens.filter(estNouveau);
  const anciens = siens.filter((g) => !estNouveau(g));
  const heure = (s: string) =>
    new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", dateStyle: "short", timeStyle: "short" }).format(new Date(s));

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Relevé du lundi — groupes découverts</h1>
      <p className="mt-1 text-sm text-gray-600">
        {dernier ? `Relevé de la semaine du ${dernier.semaine}, généré le ${heure(dernier.genere_le)} · ${dernier.nb_ecarts} écart(s). ` : ""}
        Un groupe inscrit entre au ramassage : ses médias arrivent ensuite dans l’Indexer et le savoir de DiGiSha.
      </p>
      {error ? <p className="mt-3 text-sm text-red-700">Lecture refusée : {error.message}</p> : null}
      <GroupesClient nouveaux={nouveaux} anciens={anciens} cornelia={cornelia}
        depuis={depuis ? heure(depuis) : null} />
    </div>
  );
}
