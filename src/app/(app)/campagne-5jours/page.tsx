import type { Metadata } from "next";
import { requireSt6 } from "@/lib/owner-gate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Campagne cinq matins" };
export const dynamic = "force-dynamic";

// Patrick, 09.11.2026 17h30 : « quel est le persona que nous adressons sur les plateformes ? est-il le même ? quels sont les
// messages ? » — une page de campagne dit à qui on parle, ce qu'on lui dit, où, et ce que la journée a appris. Les mesures
// viennent de la base (campagne_mesure : une ligne par lecture datée ; campagne_5jours_base() : ventes et leads) et restent
// en bas, en appui. Rien de chiffré n'est écrit ici en dur.

type Mesure = {
  mesure_id: string; mesure_le: string; canal: string; publication: string; publie_le: string | null; url: string | null;
  vues: number | null; jaime: number | null; commentaires: number | null; partages: number | null; enregistrements: number | null;
  regard_s: number | null; complet_pct: number | null; note: string | null;
};

const CAMPAGNE = "5jours-2026-11-14";
const DEBUT_CAMPAGNE = "2026-11-01";
const PLACES = 25;
const PRIX = 159;

// ── Le persona (une seule femme, sur toutes les plateformes) ─────────────────────────────────────────────────────────────
// Mesuré sur TikTok le 08.11 (Spectateurs, 7 jours) : 75 % de femmes, 55 % de plus de 45 ans, France 38 %, Antilles et
// Réunion 29 %. Sur Instagram (09.11) : les trois comptes qui interagissent sont des praticiennes du bien-être. Sur le compte
// d'Anne (@anne.grangier_bays, 4 abonnés), les vidéos « Ton fils ne te parle plus », « Tu dis à ta fille la phrase que tu
// détestais chez ta mère » font 250 à 805 vues : c'est la répétition familiale qui arrête le pouce.
const PERSONA = {
  qui: "Une femme de 45 ans et plus, francophone (Suisse romande, France, Antilles, Réunion), mère ou fille, souvent déjà dans le soin ou le bien-être.",
  ce_quelle_vit: "Quelque chose qui revient et qui n’est pas né avec elle : une tension au même endroit, un poids, une fatigue, un silence dans la famille, une phrase qu’elle répète à sa fille. Elle a essayé le bien-être classique ; ça apaise, ça ne libère pas.",
  ce_quelle_veut: "Comprendre ce qui se répète dans sa famille, le sentir sur son corps, et avoir un geste à elle pour le libérer — devenir proche-aidante de ses lignées, pas patiente de quelqu’un.",
  meme_partout: "Oui, la même femme. Ce qui change d’une plateforme à l’autre, c’est le moment où on la rencontre et donc le registre : inconnue qui découvre (TikTok, Snap Spotlight), lectrice qui suit déjà le domaine (Instagram), contact qui connaît déjà Patrick ou Anne (statuts WhatsApp).",
};

// ── Les messages (l'arc des cinq jours : une phrase qui donne, une question qui fait répondre) ──────────────────────────
const MESSAGES: { jour: string; libelle: string; phrase: string; question: string; etat: "publié" | "à valider" | "à venir" }[] = [
  { jour: "2026-11-09", libelle: "Lundi 9", phrase: "Débute chaque matin par ta clé chromatique qui soulage les maux d’être accumulés dans tes lignées.", question: "Et si ce que tu portes visait à soulager quelque chose qui n’est pas né avec toi ?", etat: "publié" },
  { jour: "2026-11-10", libelle: "Mardi 10", phrase: "Une tension qui revient a une source. On trouve les bonnes couleurs, et on libère l’Âme.", question: "Cette tension, depuis quand revient-elle ?", etat: "à valider" },
  { jour: "2026-11-11", libelle: "Mercredi 11", phrase: "Une case éteinte, ça se ressent sur ton corps. Apprends avec les femmes du Cercle.", question: "Qu’est-ce qui s’est éteint, et quand ?", etat: "à valider" },
  { jour: "2026-11-12", libelle: "Jeudi 12", phrase: "Plus ça revient dans les grands centres urbains, plus ça sent le coût de ce que tu portes sur toi pour tes lignées.", question: "Qu’est-ce que tu portes, et pour qui ?", etat: "à valider" },
  { jour: "2026-11-13", libelle: "Vendredi 13", phrase: "Les bonnes couleurs, ce sont celles qui te manquent.", question: "Laquelle te manque, aujourd’hui ?", etat: "à valider" },
  { jour: "2026-11-14", libelle: "Samedi 14 · J1", phrase: "Premier matin, 8 h 30 : la carte d’Anne et la clé en main.", question: "", etat: "à venir" },
  { jour: "2026-11-15", libelle: "Dimanche 15 · J2", phrase: "Jour de récupération : la carte d’Anne, on répète les concepts.", question: "", etat: "à venir" },
];

const PORTEURS = [
  { nom: "Patrick Bays", role: "Fondateur de la méthode SVLBH et du Cercle de Lumière Suisse Romande. Claim : Apps et outils de radiesthésie chromatique.", message: "Ce que nous t’enseignons, c’est à te connecter à ton Moi Supérieur par chromatographie virtuelle, et nous t’initions à commencer à ressentir sur ton Corps les signaux de tes défunts, pour les identifier et les libérer." },
  { nom: "Anne Grangier", role: "Chromothérapie pleine bande et décodage transgénérationnel, Fribourg. Superviseure du Cercle.", message: "Chaque matin, de 8 h 30 à 9 h 30 en direct puis en différé sur le canal WhatsApp privé, elle co-construit avec Patrick la compréhension des Âmes des participantes — celles qui comprennent les signaux de leur corps." },
];

// ── Par plateforme : le moment, le format, ce qu'on demande ───────────────────────────────────────────────────────────────
const PLATEFORMES = [
  { nom: "TikTok", compte: "@patrickbays.svlbh · 446 abonnés", moment: "Elle ne nous connaît pas. Le fil Pour toi lui montre trois secondes.", format: "Vidéo 9:16 : la phrase du jour, puis la carte (Patrick ou Anne). Son choisi par Patrick. Couverture « Une case s’est éteinte ».", demande: "Regarder jusqu’au bout, puis le lien du profil.", limite: "Pas de lien cliquable en légende ; le texte animé retient trois à quatre secondes — il faut un visage ou une voix." },
  { nom: "Instagram", compte: "@patrickbays.vlbh · 102 abonnés", moment: "Elle suit déjà le domaine ; elle lit.", format: "Carrousel 4:5 : phrase du jour + carte ; légende en paragraphes (la fiche, le direct 8 h 30 – 9 h 30, la question) ; story 9:16 avec l’autocollant lien.", demande: "Le lien de la bio ou l’autocollant de la story.", limite: "Les stories font 64 % des vues du compte : c’est là que vit le lien." },
  { nom: "WhatsApp (statuts)", compte: "z1 patrickbays.model · z3 patrickbays.ai · z2 depuis l’iPhone", moment: "Elle connaît déjà Patrick ou Anne ; le statut est un rappel, pas une découverte.", format: "Story 9:16 du jour + carte d’Anne, en statut.", demande: "Répondre au statut ou ouvrir svlbh.com/5jours.", limite: "Statuts seulement : aucun message vers des contacts ou des groupes (DEC Patrick 09.11)." },
  { nom: "Snapchat", compte: "profil public à compléter (avatar, fond, bio, lien)", moment: "Inconnue par le Spotlight ; amie par la Story.", format: "Story 9:16 + carte ; Spotlight = la vidéo du jour. Depuis l’iPhone (le Web ne publie pas de Story).", demande: "Le lien du profil public.", limite: "Chiffres à relever dans l’app ; audience encore inconnue." },
];

const CANAUX: Record<string, { nom: string; couleur: string }> = {
  tiktok: { nom: "TikTok", couleur: "#111827" }, instagram: { nom: "Instagram", couleur: "#9d174d" },
  whatsapp: { nom: "WhatsApp", couleur: "#15803d" }, snapchat: { nom: "Snapchat", couleur: "#a16207" }, base: { nom: "Base", couleur: "#5b4a8a" },
};
const fmtHeure = new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" });
const fmtJour = new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", weekday: "long", day: "numeric", month: "long" });
const cleJour = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const n = (x: number | null | undefined) => (x == null ? "—" : new Intl.NumberFormat("fr-CH").format(x));

export default async function Page() {
  await requireSt6();
  const supabase = await createClient();
  const [mesuresR, baseR] = await Promise.all([
    supabase.from("campagne_mesure").select("*").eq("campagne", CAMPAGNE).order("mesure_le", { ascending: false }),
    supabase.rpc("campagne_5jours_base", { p_depuis: DEBUT_CAMPAGNE, p_prix: PRIX }),
  ]);
  const mesures = (mesuresR.data ?? []) as Mesure[];
  const base = ((baseR.data ?? []) as { ventes: number; leads: number }[])[0];
  const ventes = Number(base?.ventes ?? 0);
  const leads = Number(base?.leads ?? 0);
  const erreurs = [mesuresR.error, baseR.error].filter(Boolean).map((e) => e!.message || "erreur sans message");

  const dernieres = new Map<string, Mesure>();
  for (const m of mesures) { const k = `${m.canal}·${m.publication}`; if (!dernieres.has(k)) dernieres.set(k, m); }
  const lues = [...dernieres.values()].sort((a, b) => (a.publie_le ?? a.mesure_le).localeCompare(b.publie_le ?? b.mesure_le));
  const derniereLecture = mesures[0]?.mesure_le ?? null;
  const regard = lues.find((m) => m.regard_s != null);
  const vuesTikTok = lues.filter((m) => m.canal === "tiktok" && !m.publication.startsWith("Compte")).reduce((s, m) => s + (m.vues ?? 0), 0);
  const jours = [...new Set(lues.map((m) => cleJour(m.publie_le ?? m.mesure_le)))].sort().reverse();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-[15px] leading-relaxed">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#7c6aa8]">Campagne · session du samedi 14 au mercredi 18 novembre 2026</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Cinq matins pour goûter la lecture vibratoire chromatique</h1>
        <p className="mt-2 max-w-3xl text-[#3a2c66]">
          Une clé chromatique qui soulage les maux d’être accumulés dans tes lignées. Avec Anne Grangier et Patrick Bays, en direct de 8 h 30 à 9 h 30 puis en différé sur le canal WhatsApp privé.
          <strong> CHF {PRIX} · {PLACES} places</strong> · <a className="underline" href="https://svlbh.com/5jours" target="_blank" rel="noreferrer">svlbh.com/5jours</a>.
        </p>
        {erreurs.length > 0 && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-800">Lecture incomplète : {erreurs.join(" · ")}</p>}
      </header>

      <section aria-label="Où on en est" className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tuile titre="Places vendues" valeur={`${ventes} / ${PLACES}`} sous={`depuis le 1er novembre · ${n(ventes * PRIX)} CHF`} fort />
        <Tuile titre="Leads initiation" valeur={n(leads)} sous="depuis le 1er novembre" />
        <Tuile titre="Vues TikTok (campagne)" valeur={n(vuesTikTok)} sous="publications de la campagne, hors compte" />
        <Tuile titre="Regard moyen" valeur={regard?.regard_s != null ? `${regard.regard_s} s` : "—"} sous={regard ? `${regard.complet_pct ?? "—"} % jusqu’au bout · ${regard.publication}` : "pas encore relevé"} />
      </section>

      <Bloc titre="À qui on parle" sous="Un seul persona, sur toutes les plateformes">
        <dl className="grid gap-4 md:grid-cols-2">
          <Def t="Qui elle est">{PERSONA.qui}</Def>
          <Def t="Ce qu’elle vit">{PERSONA.ce_quelle_vit}</Def>
          <Def t="Ce qu’elle veut">{PERSONA.ce_quelle_veut}</Def>
          <Def t="Le même persona partout ?">{PERSONA.meme_partout}</Def>
        </dl>
        <p className="mt-3 text-sm text-[#5b4a8a]">Preuve de terrain : sur le compte TikTok d’Anne (4 abonnés), « Ton fils ne te parle plus », « Tu dis à ta fille la phrase que tu détestais chez ta mère » font 250 à 805 vues. La répétition familiale, dite dans une scène de vie, arrête le pouce ; le concept, non.</p>
      </Bloc>

      <Bloc titre="Ce qu’on lui dit" sous="L’arc des cinq jours : une phrase qui donne, une question qui fait répondre, le geste svlbh.com/5jours">
        <ol className="space-y-2">
          {MESSAGES.map((m) => (
            <li key={m.jour} className="grid gap-1 rounded-lg border border-[#e2d6ff] bg-white px-4 py-3 md:grid-cols-[9rem_1fr_auto] md:items-start md:gap-4">
              <span className="font-semibold">{m.libelle}</span>
              <span><span className="font-semibold">{m.phrase}</span>{m.question && <em className="block text-[#5b4a8a]">{m.question}</em>}</span>
              <Etat etat={m.etat} />
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PORTEURS.map((p) => (
            <div key={p.nom} className="rounded-lg border border-[#e2d6ff] bg-[#f5f2fb] px-4 py-3">
              <p className="font-bold">{p.nom}</p>
              <p className="text-sm text-[#5b4a8a]">{p.role}</p>
              <p className="mt-2 text-sm">{p.message}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#5b4a8a]">Chaque jour, la phrase du jour part avec la carte d’Anne (DEC Patrick 09.11 : aujourd’hui et jusqu’à dimanche). Le lundi portait aussi la carte de Patrick.</p>
      </Bloc>

      <Bloc titre="Où, et comment" sous="Le moment de rencontre change le registre, pas la femme">
        <div className="overflow-x-auto rounded-xl border border-[#e2d6ff] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f2fb] text-left text-xs uppercase tracking-wider text-[#5b4a8a]">
              <tr><th className="px-3 py-2">Plateforme</th><th className="px-3 py-2">Le moment</th><th className="px-3 py-2">Le format</th><th className="px-3 py-2">Ce qu’on demande</th><th className="px-3 py-2">La limite</th></tr>
            </thead>
            <tbody>
              {PLATEFORMES.map((p) => (
                <tr key={p.nom} className="border-t border-[#efe9ff] align-top">
                  <td className="px-3 py-2"><strong>{p.nom}</strong><br /><span className="text-xs text-[#5b4a8a]">{p.compte}</span></td>
                  <td className="px-3 py-2">{p.moment}</td><td className="px-3 py-2">{p.format}</td><td className="px-3 py-2">{p.demande}</td><td className="px-3 py-2 text-[#5b4a8a]">{p.limite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloc>

      <Bloc titre="Ce que la journée a appris" sous="Lu à la dernière mesure, et ce qu’on en fait">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>TikTok distribue, le texte animé ne retient pas.</strong> Le motion du dimanche soir : 172 vues en huit heures, regard moyen {regard?.regard_s ?? "3,8"} s, décrochage à la première seconde. Décision : la prochaine vidéo porte un visage et une voix — toi face caméra 15 s, ou l’avatar Synthesia avec le script du lundi.</li>
          <li><strong>La forme positive tient autant que l’idée barrée</strong> (259 vues chacune à 17 h) : on garde le positif, il n’oppose personne.</li>
          <li><strong>Le compte d’Anne parle mieux au persona que le nôtre</strong> : ses scènes familiales font jusqu’à 805 vues avec 4 abonnés. Décision : la phrase du jour se dit aussi depuis son compte, dans sa mise en scène ; le lien svlbh.com/5jours est déjà dans sa bio.</li>
          <li><strong>Instagram se joue dans les stories</strong> (64 % des vues, le seul lien cliquable) : la story du jour avec l’autocollant lien passe avant le post.</li>
          <li><strong>Zéro vente, zéro lead au soir du jour 1</strong> : attendu pour une première journée de découverte. Les mesures qui comptent cette semaine : le regard (plus de 5 s) et les clics sur le lien (1 aujourd’hui sur Instagram).</li>
        </ul>
      </Bloc>

      <Bloc titre="À trancher" sous="Ce qui attend un mot de Patrick ou d’Anne">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Les textes du mardi au vendredi (phrase + question + légende) : à valider à 300 % avant publication.</li>
          <li>Le film du lundi : connexion Synthesia sur l’iMac, ou tournage face caméra ; script prêt.</li>
          <li>Anne : sa propre phrase pour sa carte (aujourd’hui, mes mots d’après sa fiche publique) ; son avatar en photo de profil partout (demandé 16h25, déjà sur TikTok).</li>
          <li>Snapchat : profil public à compléter (avatar, fond nid de lumière, bio, lien svlbh.com/5jours).</li>
        </ul>
      </Bloc>

      <details className="rounded-xl border border-[#e2d6ff] bg-white px-4 py-3">
        <summary className="cursor-pointer font-bold">Les mesures, lecture par lecture {derniereLecture && <span className="font-normal text-[#5b4a8a]">— dernière le {fmtJour.format(new Date(derniereLecture))} à {fmtHeure.format(new Date(derniereLecture))}</span>}</summary>
        {jours.map((j) => (
          <div key={j} className="mt-4">
            <h3 className="mb-2 font-semibold capitalize">{fmtJour.format(new Date(j + "T12:00:00Z"))}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead className="text-left text-xs uppercase tracking-wider text-[#5b4a8a]"><tr><th className="px-2 py-1">Canal</th><th className="px-2 py-1">Publication</th><th className="px-2 py-1">Heure</th><th className="px-2 py-1 text-right">Vues</th><th className="px-2 py-1 text-right">J’aime</th><th className="px-2 py-1">Note</th></tr></thead>
                <tbody>
                  {lues.filter((m) => cleJour(m.publie_le ?? m.mesure_le) === j).map((m) => (
                    <tr key={m.mesure_id} className="border-t border-[#efe9ff] align-top">
                      <td className="px-2 py-1 whitespace-nowrap"><span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: CANAUX[m.canal]?.couleur ?? "#555" }}>{CANAUX[m.canal]?.nom ?? m.canal}</span></td>
                      <td className="px-2 py-1">{m.url ? <a className="underline" href={m.url} target="_blank" rel="noreferrer">{m.publication}</a> : m.publication}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-[#5b4a8a]">{m.publie_le ? fmtHeure.format(new Date(m.publie_le)) : "—"}</td>
                      <td className="px-2 py-1 text-right">{n(m.vues)}</td><td className="px-2 py-1 text-right">{n(m.jaime)}</td>
                      <td className="px-2 py-1 text-[#5b4a8a]">{m.note ?? ""}{m.regard_s != null ? ` · regard ${m.regard_s} s, ${m.complet_pct ?? "—"} % complet` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {jours.length === 0 && <p className="mt-2 text-sm text-[#5b4a8a]">Aucune mesure relevée.</p>}
      </details>
    </main>
  );
}

function Bloc({ titre, sous, children }: { titre: string; sous?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold">{titre}</h2>
      {sous && <p className="mb-3 text-sm text-[#7c6aa8]">{sous}</p>}
      {children}
    </section>
  );
}
function Def({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#e2d6ff] bg-white px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-[#7c6aa8]">{t}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
function Etat({ etat }: { etat: "publié" | "à valider" | "à venir" }) {
  const cls = etat === "publié" ? "bg-[#e2d6ff] text-[#3a2c66]" : etat === "à valider" ? "bg-amber-100 text-amber-900" : "bg-[#f5f2fb] text-[#7c6aa8]";
  return <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{etat}</span>;
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
