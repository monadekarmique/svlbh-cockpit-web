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
import { lookupMembership, DHATU_META } from "@/lib/cercle/akashiques";
import { BacklogSidebar } from "./backlog-sidebar";
import type { BacklogItem } from "./backlog-sidebar";
import { SoinsCommunsList } from "./soins-communs-list";
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
  status: DailyStatus; // 5 valeurs : active/hidden/formation/parcours-passif/cercle-akashique
  attention_color: string | null;
  attention_steps: number | null;
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

  // 1. Toutes les thérapeutes ST4+ ACTIVE depuis la DB (plus de Make)
  const { data: therapeutesRaw } = await sb
    .from("praticienne_profile")
    .select("svlbh_id, first_name, last_name, code_praticien, stx, tx, capacity_anchor, cercle_lumiere_sr")
    .eq("pro_status", "ACTIVE")
    .in("stx", ["ST4", "ST5", "ST6"])
    .order("code_praticien", { ascending: true, nullsFirst: false });

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
      status: statusEffective(d?.status ?? null, d?.updated_at ?? null),
      attention_color: d?.attention_color ?? null,
      attention_steps: niveauAffiche,
    };
  });

  const activesTherapeutes = therapeutes.filter((t) => t.status === "active");
  const hiddenTherapeutes = therapeutes.filter((t) => t.status === "hidden");

  // 3ter. Backlog Cercle SR — items (relations + énergies offensives)
  const { data: backlogRaw } = await sb
    .from("cockpit_backlog_item")
    .select(
      "id, title, notes, autonomy_level, ref_relation_id, ref_energie_id, created_at, " +
      "rel:ref_relation_id(relation_type, end_a_label, end_a_cons:end_a_consultante_id(first_name,last_name), end_a_prat:end_a_praticienne_svlbh_id(first_name,last_name)), " +
      "ene:ref_energie_id(source_description, intensity, t_prat:target_praticienne_svlbh_id(first_name,last_name), t_cons:target_consultante_id(first_name,last_name))"
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  type BLRow = {
    id: string; title: string; notes: string | null; autonomy_level: string;
    ref_relation_id: string | null; ref_energie_id: string | null; created_at: string;
    rel: { relation_type: string | null; end_a_label: string | null;
           end_a_cons: { first_name: string | null; last_name: string | null } | null;
           end_a_prat: { first_name: string | null; last_name: string | null } | null } | null;
    ene: { source_description: string; intensity: number | null;
           t_prat: { first_name: string | null; last_name: string | null } | null;
           t_cons: { first_name: string | null; last_name: string | null } | null } | null;
  };
  const backlogItems: BacklogItem[] = ((backlogRaw ?? []) as unknown as BLRow[]).map((r) => {
    const cons = Array.isArray(r.rel?.end_a_cons) ? r.rel?.end_a_cons[0] : r.rel?.end_a_cons;
    const prat = Array.isArray(r.rel?.end_a_prat) ? r.rel?.end_a_prat[0] : r.rel?.end_a_prat;
    const ea = cons ?? prat;
    const tprat = Array.isArray(r.ene?.t_prat) ? r.ene?.t_prat[0] : r.ene?.t_prat;
    const tcons = Array.isArray(r.ene?.t_cons) ? r.ene?.t_cons[0] : r.ene?.t_cons;
    const tgt = tprat ?? tcons;
    return {
      id: r.id, title: r.title, notes: r.notes, autonomy_level: r.autonomy_level,
      ref_relation_id: r.ref_relation_id, ref_energie_id: r.ref_energie_id,
      created_at: r.created_at,
      relation: r.rel ? {
        relation_type: r.rel.relation_type,
        target_name: ea ? `${ea.first_name ?? ""} ${ea.last_name ?? ""}`.trim() : r.rel.end_a_label,
      } : null,
      energie: r.ene ? {
        source_description: r.ene.source_description,
        intensity: r.ene.intensity,
        target_name: tgt ? `${tgt.first_name ?? ""} ${tgt.last_name ?? ""}`.trim() : null,
      } : null,
    };
  });

  // Picker relations pour le form backlog (relations de la praticienne courante)
  const { data: relsForPicker } = await sb
    .from("relation")
    .select("relation_id, relation_type, end_a_label, end_a_cons:end_a_consultante_id(first_name,last_name), end_a_prat:end_a_praticienne_svlbh_id(first_name,last_name)")
    .order("created_at", { ascending: false })
    .limit(50);
  type RPickerRow = { relation_id: string; relation_type: string | null; end_a_label: string | null;
    end_a_cons: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null;
    end_a_prat: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null; };
  const relationsForPicker = ((relsForPicker ?? []) as unknown as RPickerRow[]).map((r) => {
    const cons = Array.isArray(r.end_a_cons) ? r.end_a_cons[0] : r.end_a_cons;
    const prat = Array.isArray(r.end_a_prat) ? r.end_a_prat[0] : r.end_a_prat;
    const name = (cons ?? prat) ? `${(cons ?? prat)?.first_name ?? ""} ${(cons ?? prat)?.last_name ?? ""}`.trim() : r.end_a_label ?? "?";
    return { relation_id: r.relation_id, label: `${r.relation_type ?? "?"} · ${name}` };
  });

  const canEditBacklog = isOwner || myStx === "ST5";

  // 3bis. Soins en commun — healing_paths multi-praticiennes (≥ 2 ST4+).
  // 1) charger toutes les relations (owner) + 2) attribution panel +
  // 3) healing_path_share. Filtre côté Node : contributors distincts ≥ 2.
  // DEC Patrick 2026-05-18 : section au-dessus de Thérapeutes actives.
  const { data: relsRaw } = await sb
    .from("relation")
    .select("relation_id, praticienne_svlbh_id, slideshow_title, relation_type, relation_state");
  const { data: attrsRaw } = await sb
    .from("consultante_attribution")
    .select("resource_id, praticienne_svlbh_id")
    .in("resource_type", ["relation", "soul_mission", "healing_path"]);
  const { data: sharesRaw } = await sb
    .from("healing_path_share")
    .select("source_relation_id, sender_svlbh_id, recipient_svlbh_id");

  const profileByIdRaw = new Map<string, { first_name: string | null; last_name: string | null; code_praticien: number | null }>(
    ((therapeutesRaw ?? []) as Array<{ svlbh_id: string; first_name: string | null; last_name: string | null; code_praticien: number | null }>)
      .map((p) => [p.svlbh_id, { first_name: p.first_name, last_name: p.last_name, code_praticien: p.code_praticien }]),
  );

  // (SoinCommun importé depuis ./soins-communs-list)
  const contribsByRel = new Map<string, Set<string>>();
  for (const a of (attrsRaw ?? []) as Array<{ resource_id: string; praticienne_svlbh_id: string }>) {
    if (!contribsByRel.has(a.resource_id)) contribsByRel.set(a.resource_id, new Set());
    contribsByRel.get(a.resource_id)!.add(a.praticienne_svlbh_id);
  }
  for (const s of (sharesRaw ?? []) as Array<{ source_relation_id: string; sender_svlbh_id: string; recipient_svlbh_id: string }>) {
    if (!contribsByRel.has(s.source_relation_id)) contribsByRel.set(s.source_relation_id, new Set());
    contribsByRel.get(s.source_relation_id)!.add(s.sender_svlbh_id);
    contribsByRel.get(s.source_relation_id)!.add(s.recipient_svlbh_id);
  }
  const soinsCommuns: SoinCommun[] = ((relsRaw ?? []) as Array<{
    relation_id: string; praticienne_svlbh_id: string; slideshow_title: string | null;
    relation_type: string | null; relation_state: string | null;
  }>)
    .map((r) => {
      const all = new Set<string>(contribsByRel.get(r.relation_id) ?? []);
      all.add(r.praticienne_svlbh_id);
      const distinct = Array.from(all).filter((id) => profileByIdRaw.has(id));
      if (distinct.length < 2) return null;
      return {
        relation_id: r.relation_id,
        owner_svlbh_id: r.praticienne_svlbh_id,
        title: r.slideshow_title?.trim() || r.relation_type || "(sans titre)",
        relation_type: r.relation_type,
        relation_state: r.relation_state,
        contributors: distinct.map((id) => ({
          svlbh_id: id,
          ...profileByIdRaw.get(id)!,
        })),
      };
    })
    .filter((x): x is SoinCommun => x !== null)
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

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">
            👥 Thérapeutes SVLBH du Cercle
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            {therapeutes.length} thérapeute{therapeutes.length > 1 ? "s" : ""} ST4+ ·{" "}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 min-w-0">

      {/* Section 0 : Soins en commun ST4+ du Cercle SR (≥ 2 contributeurs) */}
      <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
        <h2 className="text-base font-semibold text-emerald-900">
          🌿 Soins en commun des thérapeutes SVLBH ST4+ du Cercle SR ({soinsCommuns.length})
        </h2>
        <SoinsCommunsList
          items={soinsCommuns as SoinCommun[]}
          allTherapeutes={therapeutes.map((t) => ({
            svlbh_id: t.svlbh_id,
            first_name: t.first_name,
            last_name: t.last_name,
            code_praticien: t.code_praticien,
          }))}
          canEdit={canEditBacklog}
        />
      </section>

      {/* Sections 1 & 2 : Thérapeutes actives / cachées avec drag-and-drop */}
      <TherapeutesDnDZonesWrapper
        therapeutes={therapeutes}
        mySvlbhId={mySvlbhId}
        isOwner={isOwner}
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
              className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
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
                  <CerclesAkashiquesChipsServer svlbhKey={PATRICK_SVLBH_ID} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Apprenantes — 3 sous-sections avec DnD (Owner uniquement).
          Tier persisté en DB (table apprenante_tier), source remplace
          le tier statique du const APPRENANTES. */}
      {isOwner ? <ApprenantesDnDSection /> : null}

        </div>

        {/* Sidebar : Backlog Cercle SR */}
        <BacklogSidebar
          items={backlogItems}
          canEdit={canEditBacklog}
          relationsForPicker={relationsForPicker}
          praticiennesForPicker={therapeutes.map((t) => ({
            svlbh_id: t.svlbh_id,
            label: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim(),
          }))}
          consultantesForPicker={[]}
        />
      </div>
    </div>
  );
}

async function ApprenantesDnDSection() {
  const sb = await createClient();
  const { data } = await sb
    .from("apprenante_tier")
    .select("name, tier, description, niveaux_bloques");
  const dbByName = new Map(
    ((data ?? []) as Array<{ name: string; tier: string; description: string | null; niveaux_bloques: number | null }>).map((r) => [r.name, r]),
  );
  const items: DnDApprenante[] = APPRENANTES.map((a) => {
    const db = dbByName.get(a.name);
    const dbTier = db?.tier;
    const effectiveTier = (dbTier === "formation" || dbTier === "parcours-passif" || dbTier === "cercle-akashique")
      ? dbTier
      : (a.tier === "formation" || a.tier === "parcours-passif" || a.tier === "cercle-akashique")
      ? a.tier
      : "formation";
    return {
      name: a.name,
      tier: effectiveTier,
      emoji: a.emoji,
      description: db?.description ?? null,
      niveaux_bloques: db?.niveaux_bloques ?? null,
    };
  });
  return <ApprenantesDnD initial={items} />;
}

/** Chips des cercles akashiques d'une personne pour la section
 * Superviseurs (réutilisable ici car ApprenantesDnD a sa version client).
 * DEC Patrick 2026-05-18. */
function CerclesAkashiquesChipsServer({ svlbhKey }: { svlbhKey: string }) {
  const membership = lookupMembership(svlbhKey);
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
        const meta = DHATU_META[primary];
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
            {c.dhatus.map((d) => DHATU_META[d].emoji).join("")} {c.name}
          </span>
        );
      })}
    </div>
  );
}

