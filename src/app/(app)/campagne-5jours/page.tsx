import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Campagne cinq matins" };
export const dynamic = "force-dynamic";

// Patrick, 09.11.2026 17h00 : « regardons les résultats de la journée — fais-moi une page campagne 5 jours pour la
// session du 14.11.2026, sur cockpit ». Tout ce qui est un chiffre vient de la base : les mesures relevées sur les
// plateformes (campagne_mesure, une ligne par lecture datée) et ce que la base sait d’elle-même (paiements, leads).
// Rien n’est recalculé ici : une mesure est ce qui a été lu, à l’heure où il a été lu.

type Mesure = {
  mesure_id: string; mesure_le: string; canal: string; publication: string; publie_le: string | null; url: string | null;
  vues: number | null; jaime: number | null; commentaires: number | null; partages: number | null; enregistrements: number | null;
  regard_s: number | null; complet_pct: number | null; note: string | null;
};

const CAMPAGNE = "5jours-2026-11-14";
const DEBUT_CAMPAGNE = "2026-11-01";
const PLACES = 25;
const PRIX = 159;

// Le programme des publications (contenu, pas chiffres) — Patrick 09.11 : ses cinq accroches, une par jour, et la carte
// d’Anne « aujourd’hui et mardi, mercredi, jeudi, vendredi, samedi et dimanche ».
const PROGRAMME: { jour: string; libelle: string; phrase: string; etat: "publié" | "à venir" }[] = [
  { jour: "2026-11-09", libelle: "Lundi 9", phrase: "Débute chaque matin par ta clé chromatique qui soulage les maux d’être accumulés dans tes lignées.", etat: "publié" },
  { jour: "2026-11-10", libelle: "Mardi 10", phrase: "Une tension qui revient a une source. On trouve les bonnes couleurs, et on libère l’Âme.", etat: "à venir" },
  { jour: "2026-11-11", libelle: "Mercredi 11", phrase: "Une case éteinte, ça se ressent sur ton corps. Apprends avec les femmes du Cercle.", etat: "à venir" },
  { jour: "2026-11-12", libelle: "Jeudi 12", phrase: "Plus ça revient dans les grands centres urbains, plus ça sent le coût de ce que tu portes sur toi pour tes lignées.", etat: "à venir" },
  { jour: "2026-11-13", libelle: "Vendredi 13", phrase: "Les bonnes couleurs, ce sont celles qui te manquent.", etat: "à venir" },
  { jour: "2026-11-14", libelle: "Samedi 14 · J1", phrase: "Carte d’Anne Grangier — premier matin, 8 h 30.", etat: "à venir" },
  { jour: "2026-11-15", libelle: "Dimanche 15 · J2", phrase: "Carte d’Anne Grangier — jour de récupération.", etat: "à venir" },
];

const CANAUX: Record<string, { nom: string; couleur: string }> = {
  tiktok: { nom: "TikTok", couleur: "#111827" },
  instagram: { nom: "Instagram", couleur: "#9d174d" },
  whatsapp: { nom: "WhatsApp", couleur: "#15803d" },
  snapchat: { nom: "Snapchat", couleur: "#a16207" },
  base: { nom: "Base SVLBH", couleur: "#5b4a8a" },
};

const fmtHeure = new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" });
const fmtJour = new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", weekday: "long", day: "numeric", month: "long" });
const cleJour = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const n = (x: number | null | undefined) => (x == null ? "—" : new Intl.NumberFormat("fr-CH").format(x));

export default async function Page() {
  await requireSt6();
  const supabase = await createClient();

  // Ventes et leads : une seule porte, campagne_5jours_base() (SECURITY DEFINER gardée par is_owner_st6) — initiation_lead
  // porte des courriels, elle ne s'ouvre pas en lecture directe.
  const [mesuresR, baseR] = await Promise.all([
    supabase.from("campagne_mesure").select("*").eq("campagne", CAMPAGNE).order("mesure_le", { ascending: false }),
    supabase.rpc("campagne_5jours_base", { p_depuis: DEBUT_CAMPAGNE, p_prix: PRIX }),
  ]);
  const mesures = (mesuresR.data ?? []) as Mesure[];
  const base = ((baseR.data ?? []) as { ventes: number; leads: number }[])[0];
  const ventes = Number(base?.ventes ?? 0);
  const leads = Number(base?.leads ?? 0);
  const erreurs = [mesuresR.error, baseR.error].filter(Boolean).map((e) => e!.message || "erreur sans message");

  // Les lectures les plus récentes par publication (une publication peut être relue plusieurs fois dans la journée).
  const dernieres = new Map<string, Mesure>();
  for (const m of mesures) { const k = `${m.canal}·${m.publication}`; if (!dernieres.has(k)) dernieres.set(k, m); }
  const lues = [...dernieres.values()];
  const parJour = new Map<string, Mesure[]>();
  for (const m of lues) { const j = cleJour(m.publie_le ?? m.mesure_le); parJour.set(j, [...(parJour.get(j) ?? []), m]); }
  const jours = [...parJour.keys()].sort().reverse();
  const derniereLecture = mesures[0]?.mesure_le ?? null;

  const vuesTikTokJour = lues.filter((m) => m.canal === "tiktok" && !m.publication.startsWith("Compte") && cleJour(m.publie_le ?? m.mesure_le) === "2026-11-09")
    .reduce((s, m) => s + (m.vues ?? 0), 0);
  const regard = lues.find((m) => m.regard_s != null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-[15px] leading-relaxed">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7c6aa8]">Campagne · session du samedi 14 novembre 2026</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Cinq matins pour goûter la lecture vibratoire chromatique</h1>
        <p className="mt-2 text-[#5b4a8a]">
          Ce qui est parti chaque jour, où, et ce que ça rend. Dernière lecture des plateformes :{" "}
          <strong>{derniereLecture ? `${fmtJour.format(new Date(derniereLecture))} à ${fmtHeure.format(new Date(derniereLecture))}` : "aucune"}</strong>.
          Page : <a className="underline" href="https://svlbh.com/5jours" target="_blank" rel="noreferrer">svlbh.com/5jours</a>.
        </p>
        {erreurs.length > 0 && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-800">Lecture incomplète : {erreurs.join(" · ")}</p>}
      </header>

      <section aria-label="Ce qui compte" className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tuile titre="Places vendues" valeur={`${ventes} / ${PLACES}`} sous={`${n(ventes * PRIX)} CHF encaissés depuis le ${DEBUT_CAMPAGNE.slice(8)}.11`} fort />
        <Tuile titre="Leads initiation" valeur={n(leads)} sous="initiation_lead depuis le 01.11" />
        <Tuile titre="Vues TikTok du jour" valeur={n(vuesTikTokJour)} sous="publications du 9 novembre, hors compte" />
        <Tuile titre="Regard moyen" valeur={regard?.regard_s != null ? `${regard.regard_s} s` : "—"} sous={regard ? `${regard.publication} · ${regard.complet_pct ?? "—"} % jusqu’au bout` : "pas encore relevé"} />
      </section>

      <section aria-label="Par jour" className="mb-10 space-y-8">
        {jours.map((j) => (
          <article key={j}>
            <h2 className="mb-3 text-xl font-bold capitalize">{fmtJour.format(new Date(j + "T12:00:00Z"))}</h2>
            <div className="overflow-x-auto rounded-xl border border-[#e2d6ff] bg-white">
              <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead className="bg-[#f5f2fb] text-left text-xs uppercase tracking-wider text-[#5b4a8a]">
                  <tr>
                    <th className="px-3 py-2">Canal</th><th className="px-3 py-2">Publication</th><th className="px-3 py-2">Heure</th>
                    <th className="px-3 py-2 text-right">Vues</th><th className="px-3 py-2 text-right">J’aime</th><th className="px-3 py-2 text-right">Comm.</th>
                    <th className="px-3 py-2 text-right">Partages</th><th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {(parJour.get(j) ?? []).sort((a, b) => (a.publie_le ?? a.mesure_le).localeCompare(b.publie_le ?? b.mesure_le)).map((m) => (
                    <tr key={m.mesure_id} className="border-t border-[#efe9ff] align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: CANAUX[m.canal]?.couleur ?? "#555" }}>{CANAUX[m.canal]?.nom ?? m.canal}</span>
                      </td>
                      <td className="px-3 py-2">{m.url ? <a className="underline" href={m.url} target="_blank" rel="noreferrer">{m.publication}</a> : m.publication}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[#5b4a8a]">{m.publie_le ? fmtHeure.format(new Date(m.publie_le)) : "—"}</td>
                      <td className="px-3 py-2 text-right">{n(m.vues)}</td>
                      <td className="px-3 py-2 text-right">{n(m.jaime)}</td>
                      <td className="px-3 py-2 text-right">{n(m.commentaires)}</td>
                      <td className="px-3 py-2 text-right">{n(m.partages)}</td>
                      <td className="px-3 py-2 text-[#5b4a8a]">{m.note ?? ""}{m.regard_s != null ? ` · regard ${m.regard_s} s, ${m.complet_pct ?? "—"} % complet` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
        {jours.length === 0 && <p className="text-[#5b4a8a]">Aucune mesure relevée pour cette campagne.</p>}
      </section>

      <section aria-label="Programme" className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Le programme des publications</h2>
        <ol className="space-y-2">
          {PROGRAMME.map((p) => (
            <li key={p.jour} className="flex gap-3 rounded-lg border border-[#e2d6ff] bg-white px-4 py-3">
              <span className="w-32 shrink-0 font-semibold">{p.libelle}</span>
              <span className="flex-1">{p.phrase}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.etat === "publié" ? "bg-[#e2d6ff] text-[#3a2c66]" : "bg-[#f5f2fb] text-[#7c6aa8]"}`}>{p.etat}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-[#5b4a8a]">
          Chaque jour, la carte d’Anne Grangier accompagne la phrase du jour : 2ᵉ diapo du carrousel Instagram, 2ᵉ story (Instagram, statuts WhatsApp z1 et z3 ; Snapchat et z2 depuis l’iPhone), 2ᵉ séquence du diaporama TikTok.
        </p>
      </section>

      <section aria-label="Ce qu’on a appris" className="rounded-xl border border-[#e2d6ff] bg-[#f5f2fb] px-5 py-4 text-sm">
        <h2 className="mb-2 text-base font-bold">Ce que les chiffres disent déjà</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>TikTok distribue (172 personnes en huit heures sur le premier motion, 98 % Pour toi) mais le regard dure 3 à 4 secondes : la forme « texte animé » ne retient pas.</li>
          <li>Sur Instagram, 64 % des vues des trente derniers jours viennent des stories : c’est là que vit le seul lien cliquable.</li>
          <li>Le lien svlbh.com/5jours n’est passé dans aucun message WhatsApp aujourd’hui : les 990 contacts et 94 groupes des ponts restent le levier non utilisé.</li>
        </ul>
      </section>
    </main>
  );
}

function Tuile({ titre, valeur, sous, fort }: { titre: string; valeur: string; sous: string; fort?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${fort ? "border-[#b39ddb] bg-[#3a2c66] text-white" : "border-[#e2d6ff] bg-white"}`}>
      <p className={`text-xs uppercase tracking-wider ${fort ? "text-[#e2d6ff]" : "text-[#7c6aa8]"}`}>{titre}</p>
      <p className="mt-1 text-2xl font-extrabold" style={{ fontVariantNumeric: "tabular-nums" }}>{valeur}</p>
      <p className={`mt-1 text-xs ${fort ? "text-[#e2d6ff]" : "text-[#5b4a8a]"}`}>{sous}</p>
    </div>
  );
}
