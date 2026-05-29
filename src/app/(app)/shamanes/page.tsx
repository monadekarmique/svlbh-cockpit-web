// Thérapeutes SVLBH du Cercle — vue cockpit avec :
// - compteurs ressentis ST1/ST2 actives (felt_count)
// - 3 sections : Thérapeutes actives / Thérapeutes cachées / Apprenantes
// - chaque ST4+ peut toggle son statut quotidien (active ↔ cachée)
// - badges Tx · Cx · ST à gauche du nom
// - Patrick (ST6) peut poser un sticker de couleur + nb d'étapes à libérer
// - lien WhatsApp Cercle de Lumière (z3) en haut
//
// DEC Patrick 2026-05-18 : source = DB (plus de fetchShamanesPending Make).

import Link from "next/link";
import { APPRENANTES, SUPERVISORS_VIRTUAL } from "@/lib/cercle/shamanes";
import { TherapeutesDnDZonesWrapper } from "./therapeutes-dnd-wrapper";
import { ApprenantesDnD } from "./apprenantes-dnd";
import type { DnDApprenante } from "./apprenantes-dnd";
import { getDhatuMeta, fetchDhatuMemberships } from "@/lib/cercle/akashiques";
import type { Dhatu, DhatuMeta } from "@/lib/cercle/akashiques";
import type { AkashiqueMembership } from "@/lib/cercle/akashiques";
import { getDesaCatalog, fetchDesaState } from "@/lib/cercle/desa";
import type { DesaAtom, DesaState } from "@/lib/cercle/desa";
import { apprenanteSvlbhId } from "@/lib/cercle/apprenante-uuid";
import { fetchDynamiquesByPraticienne } from "@/lib/cercle/dynamiques";
import { BacklogSidebar } from "./backlog-sidebar";
import { SoinsCommunsList } from "./soins-communs-list";
import { ShamanesAutoRefresh } from "./auto-refresh";
import type { SoinCommun } from "./soins-communs-list";

// Patrick svlbh_id pour mapper la carte virtuelle 754545 → ses cercles
const PATRICK_SVLBH_ID = "52adbc98-d2b0-4444-b89c-b1311a02a983";
import { createClient } from "@/lib/supabase/server";
import { setFeltCount, toggleFeltLike } from "./felt-actions";

const WHATSAPP_CERCLE_HREF = "https://wa.me/41799302800";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Therapeute = {
  svlbh_id: string;
  first_name: string | null;
  last_name: string | null;
  code_praticien: number | null;
  stx: string | null;
  tx: string | null;
  capacity_anchor: string | null;
  cercle_lumiere_sr: boolean | null;
  desa_active: boolean;
  status: DailyStatus; // 5 valeurs : active/hidden/formation/parcours-passif/cercle-akashique
  attention_color: string | null;
  attention_steps: number | null;
  guides_lumiere: number;
};

// Si updated_at < today (Europe/Zurich), on considère un reset implicite
// vers 'active'. Le serveur calcule ça au render.
type DailyStatus = "active" | "hidden" | "formation" | "parcours-passif" | "cercle-akashique";

function statusEffective(rawStatus: string | null, updatedAt: string | null): DailyStatus {
  const valid = new Set<DailyStatus>(["active", "hidden", "formation", "parcours-passif", "cercle-akashique"]);
  if (!rawStatus || !valid.has(rawStatus as DailyStatus)) return "active";
  if (!updatedAt) return rawStatus as DailyStatus;
  const fmt = new Intl.DateTimeFormat("fr-CH", {
    timeZone: "Europe/Zurich",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const todayZurich = fmt.format(new Date());
  const updatedZurich = fmt.format(new Date(updatedAt));
  if (updatedZurich !== todayZurich) return "active";
  return rawStatus as DailyStatus;
}

export default async function ShamanesPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const { data: me } = user
    ? await sb
        .from("praticienne_profile")
        .select("svlbh_id, stx, cercle_lumiere_sr")
        .eq("supabase_user_id", user.id)
        .maybeSingle()
    : { data: null };
  const mySvlbhId = me?.svlbh_id as string | undefined;
  const myStx = me?.stx as string | null;
  const isOwner = myStx === "ST6";
  const canEditFelt = myStx === "ST4" || myStx === "ST5" || myStx === "ST6";

  // 1. Membres du Cercle de Lumière (DEC Patrick 2026-05-28) :
  //    stx ∈ ST2..ST6 ∩ cercle_lumiere_sr=true ∩ cercle_veto=false ∩ ACTIVE.
  //    Une thérapeute peut être membre dès ST2+, choisie par le Cercle,
  //    avec droit de veto Patrick (colonne cercle_veto).
  const { data: therapeutesRaw } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, code_praticien, stx, tx, capacity_anchor, cercle_lumiere_sr, desa_active, guides_lumiere")
    .eq("pro_status", "ACTIVE")
    .eq("cercle_lumiere_sr", true)
    .eq("cercle_veto", false)
    .in("stx", ["ST2", "ST3", "ST4", "ST5", "ST6"])
    .order("code_praticien", { ascending: true, nullsFirst: false });

  // 1bis. Dynamiques SVLBH attribuées à chaque praticienne (DEC Patrick 2026-05-20)
  const dynamiquesByPraticienne = await fetchDynamiquesByPraticienne(sb);

  // 1ter. Adhésions dhātu des praticiennes DB depuis la table dhatu_membership
  // (DEC Patrick 2026-05-27 — remplace le statique pour les clés svlbh_id).
  const dhatuByPraticienne = await fetchDhatuMemberships(sb);
  // 1quater. Métadonnées des 7 dhātu atomiques (label/emoji/couleur) depuis
  // `dhatu_atom` — source canonique unique (Phase 2 DEC Patrick 2026-05-28).
  const dhatuMeta = await getDhatuMeta(sb);
  // 1quinquies. DESA — capacités de libération Dark Entities & Spirit
  // Attachments accordées dynamiquement par l'Owner (DEC Patrick 2026-05-29).
  const [desaCatalog, desaStateByPraticienne] = await Promise.all([
    getDesaCatalog(sb),
    fetchDesaState(sb),
  ]);
  // 1quinquies-bis. Apprenantes cachées par hôte (sub-cards thérapeutes).
  // DEC Patrick 2026-05-29. État DESA/BDEC déjà inclus dans
  // desaStateByPraticienne via leur svlbh_id synthétique.
  const { data: cacheesRaw } = await sb
    .from("apprenante_cachee")
    .select("id, svlbh_id, host_svlbh_id, role, display_order")
    .order("host_svlbh_id", { ascending: true })
    .order("display_order", { ascending: true });
  const cacheesByHost: Record<string, Array<{
    id: string; svlbh_id: string; role: string | null;
    desa_granted: string[]; desa_karmic: string[];
  }>> = {};
  for (const c of (cacheesRaw ?? []) as Array<{
    id: string; svlbh_id: string; host_svlbh_id: string;
    role: string | null; display_order: number;
  }>) {
    if (!cacheesByHost[c.host_svlbh_id]) cacheesByHost[c.host_svlbh_id] = [];
    const st = desaStateByPraticienne[c.svlbh_id];
    cacheesByHost[c.host_svlbh_id].push({
      id: c.id,
      svlbh_id: c.svlbh_id,
      role: c.role,
      desa_granted: st?.granted ?? [],
      desa_karmic: st?.karmic ?? [],
    });
  }
  // Droit d'écrire sur les cachées : Owner OU membre du Cercle SR.
  const canWriteCachees = isOwner || me?.cercle_lumiere_sr === true;
  // 1sexies. Reverse map des liens NSB : pour chaque nom cité dans
  // APPRENANTES[].nsb_links, on construit la liste des sources (followers).
  // Ces pastilles s'affichent sur la carte de la personne CITÉE, pas sur
  // celle de la source. DEC Patrick 2026-05-29.
  const nsbFollowersByName: Record<string, Array<{ name: string; cercle?: string }>> = {};
  for (const a of APPRENANTES) {
    for (const link of a.nsb_links ?? []) {
      if (!nsbFollowersByName[link.name]) nsbFollowersByName[link.name] = [];
      nsbFollowersByName[link.name].push({ name: a.name, cercle: link.cercle });
    }
  }

  // 2. Daily status pour chaque
  const { data: dailyRaw } = await sb
    .from("praticienne_daily_status")
    .select("svlbh_id, status, updated_at, attention_color, attention_steps");
  type DailyRow = {
    svlbh_id: string; status: string; updated_at: string;
    attention_color: string | null; attention_steps: number | null;
  };
  const dailyMap = new Map<string, DailyRow>(
    ((dailyRaw ?? []) as DailyRow[]).map((r) => [r.svlbh_id, r]),
  );

  // Agrégat niveau_shamanique_bloques par praticienne. DEC Patrick 2026-05-18 :
  // 2 sources cumulées :
  //   (a) praticienne_svlbh_id = X (relations qu'elle possède côté praticienne)
  //   (b) end_a_praticienne_svlbh_id = X (soins reçus par X comme cible
  //       — ex : Patrick crée une relation vers Anne avec NSB 57)
  const { data: niveauxRaw } = await sb
    .from("relation")
    .select("praticienne_svlbh_id, end_a_praticienne_svlbh_id, niveau_shamanique_bloques")
    .eq("relation_state", "bloquée")
    .not("niveau_shamanique_bloques", "is", null);
  const niveauxSomme = new Map<string, number>();
  for (const r of (niveauxRaw ?? []) as Array<{ praticienne_svlbh_id: string | null; end_a_praticienne_svlbh_id: string | null; niveau_shamanique_bloques: number }>) {
    const v = r.niveau_shamanique_bloques ?? 0;
    if (r.praticienne_svlbh_id) {
      niveauxSomme.set(r.praticienne_svlbh_id, (niveauxSomme.get(r.praticienne_svlbh_id) ?? 0) + v);
    }
    if (r.end_a_praticienne_svlbh_id) {
      niveauxSomme.set(r.end_a_praticienne_svlbh_id, (niveauxSomme.get(r.end_a_praticienne_svlbh_id) ?? 0) + v);
    }
  }
  // En plus : niveaux_bloques de l'override apprenante_tier (déclassement
  // temporaire ST4+ comme Cornelia 15). Lookup par svlbh_id. DEC Patrick.
  const { data: overrideNiveaux } = await sb
    .from("apprenante_tier")
    .select("svlbh_id, niveaux_bloques")
    .not("svlbh_id", "is", null)
    .not("niveaux_bloques", "is", null);
  const overrideMap = new Map<string, number>();
  for (const r of (overrideNiveaux ?? []) as Array<{ svlbh_id: string; niveaux_bloques: number }>) {
    overrideMap.set(r.svlbh_id, r.niveaux_bloques);
  }

  const therapeutes: Therapeute[] = ((therapeutesRaw ?? []) as Array<{
    svlbh_id: string; first_name: string | null; last_name: string | null;
    code_praticien: number | null; stx: string | null; tx: string | null;
    capacity_anchor: string | null; cercle_lumiere_sr: boolean | null;
    desa_active: boolean | null;
    guides_lumiere: number | null;
  }>).map((p) => {
    const d = dailyMap.get(p.svlbh_id);
    const somme = niveauxSomme.get(p.svlbh_id) ?? 0;
    const overrideNiv = overrideMap.get(p.svlbh_id);
    // Priorité : attention_steps manuel > override apprenante_tier > somme relations
    const niveauAffiche =
      d?.attention_steps != null ? d.attention_steps :
      overrideNiv != null ? overrideNiv :
      somme > 0 ? somme : null;
    return {
      svlbh_id: p.svlbh_id,
      first_name: p.first_name,
      last_name: p.last_name,
      code_praticien: p.code_praticien,
      stx: p.stx,
      tx: p.tx,
      capacity_anchor: p.capacity_anchor,
      cercle_lumiere_sr: p.cercle_lumiere_sr,
      desa_active: p.desa_active ?? false,
      status: statusEffective(d?.status ?? null, d?.updated_at ?? null),
      attention_color: d?.attention_color ?? null,
      attention_steps: niveauAffiche,
      guides_lumiere: p.guides_lumiere ?? 0,
    };
  });

  const activesTherapeutes = therapeutes.filter((t) => t.status === "active");
  const hiddenTherapeutes = therapeutes.filter((t) => t.status === "hidden");

  // 3ter. Backlog Cercle SR — vue de tri/saturation des Soins en commun.
  // Map saturation par soin commun. Items proviennent automatiquement des
  // soinsCommuns (calculé plus bas). Pas de saisie manuelle.
  const { data: saturationRaw } = await sb
    .from("cercle_sr_saturation")
    .select("ref_type, ref_id, saturation_level, dissipation_mode");
  const saturationMap: Record<string, "trois_plus" | "deux" | "un"> = {};
  const dissipationMap: Record<string, "massif" | "moyen" | "minimal" | null> = {};
  for (const r of (saturationRaw ?? []) as Array<{ ref_type: string; ref_id: string; saturation_level: "trois_plus" | "deux" | "un"; dissipation_mode: "massif" | "moyen" | "minimal" | null }>) {
    const kind = r.ref_type === "energie_offensive" ? "energie" : "relation";
    const key = `${kind}:${r.ref_id}`;
    saturationMap[key] = r.saturation_level;
    dissipationMap[key] = r.dissipation_mode;
  }
  const canEditBacklog = isOwner || myStx === "ST5";

  // 3bis. Soins en commun — relations + énergies offensives multi-praticiennes.
  // Filtre côté Node : contributors distincts ≥ 2.
  // DEC Patrick 2026-05-18 (option 2) : inclus aussi energie_offensive_tiers.
  const { data: relsRaw } = await sb
    .from("relation")
    .select("relation_id, praticienne_svlbh_id, slideshow_title, relation_type, relation_state, purpose");
  const { data: enesRaw } = await sb
    .from("energie_offensive_tiers")
    .select("id, source_description, intensity, created_by_svlbh_id")
    .eq("status", "active");
  const { data: attrsRaw } = await sb
    .from("consultante_attribution")
    .select("resource_id, praticienne_svlbh_id, resource_type")
    .in("resource_type", ["relation", "soul_mission", "healing_path", "energie_offensive"]);
  const { data: sharesRaw } = await sb
    .from("healing_path_share")
    .select("source_relation_id, sender_svlbh_id, recipient_svlbh_id");

  const profileByIdRaw = new Map<string, { first_name: string | null; last_name: string | null; code_praticien: number | null }>(
    ((therapeutesRaw ?? []) as Array<{ svlbh_id: string; first_name: string | null; last_name: string | null; code_praticien: number | null }>)
      .map((p) => [p.svlbh_id, { first_name: p.first_name, last_name: p.last_name, code_praticien: p.code_praticien }]),
  );

  // (SoinCommun importé depuis ./soins-communs-list)
  // Index contributors par ressource (relation OU energie_offensive).
  // Clé = `${resourceType}:${resourceId}`.
  const contribsByRef = new Map<string, Set<string>>();
  for (const a of (attrsRaw ?? []) as Array<{ resource_id: string; praticienne_svlbh_id: string; resource_type: string }>) {
    const rt = a.resource_type === "soul_mission" || a.resource_type === "healing_path" ? "relation" : a.resource_type;
    const key = `${rt}:${a.resource_id}`;
    if (!contribsByRef.has(key)) contribsByRef.set(key, new Set());
    contribsByRef.get(key)!.add(a.praticienne_svlbh_id);
  }
  for (const s of (sharesRaw ?? []) as Array<{ source_relation_id: string; sender_svlbh_id: string; recipient_svlbh_id: string }>) {
    const key = `relation:${s.source_relation_id}`;
    if (!contribsByRef.has(key)) contribsByRef.set(key, new Set());
    contribsByRef.get(key)!.add(s.sender_svlbh_id);
    contribsByRef.get(key)!.add(s.recipient_svlbh_id);
  }

  const soinsFromRels: SoinCommun[] = ((relsRaw ?? []) as Array<{
    relation_id: string; praticienne_svlbh_id: string; slideshow_title: string | null;
    relation_type: string | null; relation_state: string | null; purpose: string | null;
  }>)
    .map((r) => {
      const all = new Set<string>(contribsByRef.get(`relation:${r.relation_id}`) ?? []);
      all.add(r.praticienne_svlbh_id);
      const distinct = Array.from(all).filter((id) => profileByIdRaw.has(id));
      if (distinct.length < 2) return null;
      return {
        kind: "relation" as const,
        ref_id: r.relation_id,
        purpose: (r.purpose === "soul_mission" ? "soul_mission" : "relation") as "relation" | "soul_mission",
        owner_svlbh_id: r.praticienne_svlbh_id,
        title: r.slideshow_title?.trim() || r.relation_type || "(sans titre)",
        relation_type: r.relation_type,
        relation_state: r.relation_state,
        contributors: distinct.map((id) => ({ svlbh_id: id, ...profileByIdRaw.get(id)! })),
      };
    })
    .filter(Boolean) as SoinCommun[];

  const soinsFromEnes: SoinCommun[] = ((enesRaw ?? []) as Array<{
    id: string; source_description: string; intensity: number | null; created_by_svlbh_id: string;
  }>)
    .map((e) => {
      const all = new Set<string>(contribsByRef.get(`energie_offensive:${e.id}`) ?? []);
      all.add(e.created_by_svlbh_id);
      const distinct = Array.from(all).filter((id) => profileByIdRaw.has(id));
      if (distinct.length < 2) return null;
      return {
        kind: "energie" as const,
        ref_id: e.id,
        owner_svlbh_id: e.created_by_svlbh_id,
        title: e.source_description,
        relation_type: null,
        relation_state: null,
        source_description: e.source_description,
        intensity: e.intensity,
        contributors: distinct.map((id) => ({ svlbh_id: id, ...profileByIdRaw.get(id)! })),
      };
    })
    .filter(Boolean) as SoinCommun[];

  const soinsCommuns: SoinCommun[] = [...soinsFromRels, ...soinsFromEnes]
    .sort((a, b) => b.contributors.length - a.contributors.length);

  // 3. Compteurs felt (ST1 / ST2 actives)
  const { data: feltRows } = await sb
    .from("cercle_felt_count")
    .select("type, felt_value, likes_count")
    .order("type");
  const felt = Object.fromEntries(
    ((feltRows ?? []) as Array<{ type: string; felt_value: number; likes_count: number }>).map((r) => [r.type, r]),
  );
  const { data: myLikes } = mySvlbhId
    ? await sb
        .from("cercle_felt_count_like")
        .select("felt_count_type")
        .eq("liker_svlbh_id", mySvlbhId)
    : { data: [] };
  const likedByMe = new Set(((myLikes ?? []) as Array<{ felt_count_type: string }>).map((l) => l.felt_count_type));

  return (
    <div className="space-y-5">
      {/* Auto-refresh 15s pour limiter les conflits multi-utilisateur
          (router.refresh() ne wipe pas le state local des éditeurs). */}
      <ShamanesAutoRefresh intervalMs={15000} />

      <nav className="relative flex items-center">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Cockpit
        </Link>
        <a
          href={WHATSAPP_CERCLE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
          title="WhatsApp Cercle de Lumière SVLBH (z3 · +41 79 930 28 00)"
        >
          💬 WhatsApp · Cercle de Lumière
        </a>
      </nav>

      {/* Glossaire des acronymes utilisés sur la page (DEC Patrick 2026-05-29). */}
      <details className="rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-[11px]">
        <summary className="cursor-pointer font-semibold text-neutral-700">
          ℹ️ Glossaire
        </summary>
        <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-mono font-bold text-rose-700">NSB</dt>
            <dd className="text-neutral-700">Niveaux Shamaniques Bloqués</dd>
          </div>
        </dl>
      </details>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">
            👥 Thérapeutes SVLBH du Cercle
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            {therapeutes.length} membre{therapeutes.length > 1 ? "s" : ""} du Cercle (ST2+) ·{" "}
            {activesTherapeutes.length} active{activesTherapeutes.length > 1 ? "s" : ""},{" "}
            {hiddenTherapeutes.length} cachée{hiddenTherapeutes.length > 1 ? "s" : ""} aujourd&apos;hui
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-[22rem] sm:flex-shrink-0 sm:gap-3">
          {(["ST1", "ST2"] as const).map((type) => {
            const f = felt[type];
            const val = f?.felt_value ?? 0;
            const likes = f?.likes_count ?? 0;
            const isLiked = likedByMe.has(type);
            return (
              <div key={type} className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900">{type} actives</p>
                  <span className="text-[9px] italic text-neutral-500">ressenti</span>
                </div>
                {canEditFelt ? (
                  <form action={setFeltCount} className="mt-1 flex items-center gap-1.5">
                    <input type="hidden" name="type" value={type} />
                    <input
                      name="value"
                      type="number"
                      min={0}
                      max={9999}
                      defaultValue={val}
                      className="h-9 w-16 rounded-lg border border-blue-300 bg-white px-2 font-mono text-xl font-extrabold tabular-nums text-blue-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-lg bg-blue-900 px-2 text-[11px] font-semibold text-white hover:bg-blue-800"
                    >
                      Sauver
                    </button>
                  </form>
                ) : (
                  <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-blue-900">{val}</p>
                )}
                <form action={toggleFeltLike} className="mt-1.5 flex items-center justify-between">
                  <input type="hidden" name="type" value={type} />
                  <button
                    type="submit"
                    title={isLiked ? "Retirer mon like" : "Confirmer ce ressenti"}
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] transition " +
                      (isLiked
                        ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                        : "border border-neutral-300 bg-white text-neutral-700 hover:bg-rose-50")
                    }
                  >
                    {isLiked ? "❤️ liké" : "🤍 j'aime"}
                  </button>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {likes} like{likes > 1 ? "s" : ""}
                  </span>
                </form>
              </div>
            );
          })}
        </div>
      </header>

      {/* Section 0 : Soins en commun des membres du Cercle (≥ 2 contributeurs) */}
      <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
        <h2 className="text-base font-semibold text-emerald-900">
          🌿 Soins en commun des thérapeutes du Cercle de Lumière ({soinsCommuns.length})
        </h2>
        <SoinsCommunsList
          items={soinsCommuns as SoinCommun[]}
          allTherapeutes={therapeutes.map((t) => ({
            svlbh_id: t.svlbh_id,
            first_name: t.first_name,
            last_name: t.last_name,
            code_praticien: t.code_praticien,
          }))}
          dissipationMap={dissipationMap}
          canEdit={canEditBacklog}
        />
      </section>

      {/* Section 0bis : Backlog Cercle SR — vue 3 buckets DnD saturation */}
      <BacklogSidebar
        soins={soinsCommuns}
        saturationMap={saturationMap}
        dissipationMap={dissipationMap}
        canEdit={canEditBacklog}
      />

      {/* Sections 1 & 2 : Thérapeutes actives / cachées (rendu statique). */}
      <TherapeutesDnDZonesWrapper
        therapeutes={therapeutes}
        mySvlbhId={mySvlbhId}
        isOwner={isOwner}
        dynamiquesByPraticienne={dynamiquesByPraticienne}
        dhatuByPraticienne={dhatuByPraticienne}
        dhatuMeta={dhatuMeta}
        desaCatalog={desaCatalog}
        desaStateByPraticienne={desaStateByPraticienne}
        nsbFollowersByName={nsbFollowersByName}
        cacheesByHost={cacheesByHost}
        canWriteCachees={canWriteCachees}
      />

      {/* Cartes virtuelles Patrick × 2 (superviseurs) — sous les thérapeutes
          actives, DEC Patrick 2026-05-18 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-blue-900">
          🔵 Superviseurs ({SUPERVISORS_VIRTUAL.length})
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUPERVISORS_VIRTUAL.map((s) => (
            <li
              key={s.code}
              className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm"
              style={{ borderLeftColor: s.color, borderLeftWidth: 4 }}
            >
              {s.cercle_number != null ? (
                <span
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
                  style={{ backgroundColor: s.color }}
                  title={`n°${s.cercle_number} du Cercle`}
                >
                  {s.cercle_number}
                </span>
              ) : (
                <span className="text-xl">{s.emoji}</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900">
                  Patrick Bays{" "}
                  <span className="font-mono text-[10px] text-neutral-500">
                    #{s.code}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] font-semibold" style={{ color: s.color }}>
                  {s.role_label}
                </p>
                <p className="mt-0.5 text-[9px] italic text-neutral-500">
                  Reconnaissance Shamane Cercle de Lumière SR · certifié T3
                </p>
                {s.code === "754545" ? (
                  <CerclesAkashiquesChipsServer
                    svlbhKey={PATRICK_SVLBH_ID}
                    dhatuByPraticienne={dhatuByPraticienne}
                    dhatuMeta={dhatuMeta}
                  />
                ) : null}
              </div>
              {/* BDEC top-right — codes karmiques verts (gisants).
                  Affichés display-only sur la carte virtuelle superviseur.
                  DEC Patrick 2026-05-29. */}
              {s.bdec_karmic && s.bdec_karmic.length > 0 ? (
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    {s.bdec_karmic.map((code) => (
                      <span
                        key={code}
                        className="rounded-md border-2 border-emerald-500 bg-emerald-50 px-1 py-0.5 font-mono text-[10px] font-bold text-emerald-700"
                        title={`${code} — conscience gisante BDEC karmique`}
                      >
                        {code}
                      </span>
                    ))}
                    <span
                      className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900"
                      title="BDEC — Consciences gisantes (display-only sur carte virtuelle)"
                    >
                      BDEC
                    </span>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Apprenantes — visibles à tout membre du Cercle SR (Owner ou
          cercle_lumiere_sr=true). DEC Patrick 2026-05-29 : "Toutes les
          membres du cercle de lumière peuvent voir tous les membres du
          cercle." Tier persisté en DB (apprenante_tier) ; static APPRENANTES
          en fallback. */}
      {canWriteCachees ? <ApprenantesDnDSection canWriteCachees={canWriteCachees} /> : null}
    </div>
  );
}

async function ApprenantesDnDSection({ canWriteCachees }: { canWriteCachees: boolean }) {
  const sb = await createClient();
  const [dhatuMeta, desaCatalog, desaStateByPraticienne] = await Promise.all([
    getDhatuMeta(sb),
    getDesaCatalog(sb),
    fetchDesaState(sb),
  ]);
  // Reverse map des liens NSB (cf. parent function pour la même logique).
  const nsbFollowersByName: Record<string, Array<{ name: string; cercle?: string }>> = {};
  for (const a of APPRENANTES) {
    for (const link of a.nsb_links ?? []) {
      if (!nsbFollowersByName[link.name]) nsbFollowersByName[link.name] = [];
      nsbFollowersByName[link.name].push({ name: a.name, cercle: link.cercle });
    }
  }
  const { data } = await sb
    .from("apprenante_tier")
    .select("name, tier, description, niveaux_bloques");
  const dbByName = new Map(
    ((data ?? []) as Array<{ name: string; tier: string; description: string | null; niveaux_bloques: number | null }>).map((r) => [r.name, r]),
  );
  // Cachées par host_svlbh_id (incluant les svlbh_id synthétiques des apprenantes).
  const { data: cacheesRaw } = await sb
    .from("apprenante_cachee")
    .select("id, svlbh_id, host_svlbh_id, role, display_order")
    .order("host_svlbh_id", { ascending: true })
    .order("display_order", { ascending: true });
  const cacheesByHost: Record<string, Array<{
    id: string; svlbh_id: string; role: string | null;
    desa_granted: string[]; desa_karmic: string[];
  }>> = {};
  for (const c of (cacheesRaw ?? []) as Array<{
    id: string; svlbh_id: string; host_svlbh_id: string;
    role: string | null; display_order: number;
  }>) {
    if (!cacheesByHost[c.host_svlbh_id]) cacheesByHost[c.host_svlbh_id] = [];
    const st = desaStateByPraticienne[c.svlbh_id];
    cacheesByHost[c.host_svlbh_id].push({
      id: c.id,
      svlbh_id: c.svlbh_id,
      role: c.role,
      desa_granted: st?.granted ?? [],
      desa_karmic: st?.karmic ?? [],
    });
  }
  const items: DnDApprenante[] = APPRENANTES.map((a) => {
    const db = dbByName.get(a.name);
    const dbTier = db?.tier;
    const validTiers = new Set(["st3-active", "st1-active", "formation", "parcours-passif", "cercle-akashique"]);
    const effectiveTier = dbTier && validTiers.has(dbTier)
      ? (dbTier as "st3-active" | "st1-active" | "formation" | "parcours-passif" | "cercle-akashique")
      : validTiers.has(a.tier)
      ? (a.tier as "st3-active" | "st1-active" | "formation" | "parcours-passif" | "cercle-akashique")
      : "formation";
    // UUIDv5 déterministe pour les apprenantes statiques (pas d'svlbh_id réel
    // en DB). Permet de stocker leurs attributions DESA dans la même table
    // praticienne_desa_capacity que les therapeutes.
    const svlbhId = apprenanteSvlbhId(a.name);
    return {
      name: a.name,
      svlbh_id: svlbhId,
      tier: effectiveTier,
      emoji: a.emoji,
      description: db?.description ?? null,
      niveaux_bloques: db?.niveaux_bloques ?? null,
      desa_active: a.desa_active ?? false,
      desa_granted: desaStateByPraticienne[svlbhId]?.granted ?? [],
      desa_karmic: desaStateByPraticienne[svlbhId]?.karmic ?? [],
      tx: a.tx,
      cx: a.cx,
      stx: a.stx,
      nsb_links: a.nsb_links,
      nsb_followers: nsbFollowersByName[a.name] ?? [],
      nsb_familial: a.nsb_familial,
      cachees: cacheesByHost[svlbhId] ?? [],
    };
  });
  return (
    <ApprenantesDnD
      initial={items}
      dhatuMeta={dhatuMeta}
      desaCatalog={desaCatalog}
      canWriteCachees={canWriteCachees}
    />
  );
}

/** Chips des cercles akashiques d'une personne pour la section
 * Superviseurs (réutilisable ici car ApprenantesDnD a sa version client).
 * DEC Patrick 2026-05-18. */
function CerclesAkashiquesChipsServer({
  svlbhKey,
  dhatuByPraticienne,
  dhatuMeta,
}: {
  svlbhKey: string;
  dhatuByPraticienne: Record<string, AkashiqueMembership>;
  dhatuMeta: Record<Dhatu, DhatuMeta>;
}) {
  const membership = dhatuByPraticienne[svlbhKey] ?? null;
  if (!membership) return null;
  const all = [
    ...membership.membres.map((c) => ({ c, isFormation: false })),
    ...membership.formation.map((c) => ({ c, isFormation: true })),
  ];
  if (all.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {all.map(({ c, isFormation }) => {
        const primary = c.dhatus[0];
        const meta = dhatuMeta[primary];
        if (!meta) return null;
        return (
          <span
            key={c.name}
            className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              borderColor: meta.color,
              color: meta.color,
              backgroundColor: isFormation ? "transparent" : `${meta.color}10`,
              opacity: isFormation ? 0.7 : 1,
              borderStyle: isFormation ? "dashed" : "solid",
            }}
            title={isFormation ? `Cercle ${c.name} — en formation` : `Cercle ${c.name} — membre`}
          >
            {c.dhatus.map((d) => dhatuMeta[d]?.emoji ?? "").join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

