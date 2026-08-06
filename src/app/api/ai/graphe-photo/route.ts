// POST /api/ai/graphe-photo — reconstruire un graphe d'audit depuis une CAPTURE.
//
// DEC Patrick 2026-08-06. Appelant : PhotoVersGrapheSheet.swift (Cercle, 018cfe4),
// qui envoie { image_base64, mime } avec x-cercle-secret + Bearer Supabase, et
// attend { canvas_graph } (schéma AuditEntitesModels.swift) ou { error }.
//
// ⛔ La clé Anthropic vit ICI, jamais dans l'app (TestFlight → extractible).
// L'endpoint vit sur cockpit.svlbh.com parce que c'est là que l'app EN PROD
// pointe déjà — la spec disait pro-web, mais changer l'URL app = un rebuild ;
// changer le serveur = zéro rebuild (réconcilié sur l'intention).
//
// ⚠️ CONTRAT DE SORTIE : le décodeur Swift synthétisé n'applique PAS les valeurs
// par défaut — toute clé non optionnelle absente fait échouer TOUT le graphe.
// Le modèle de vision rend donc un JSON INTERMÉDIAIRE léger, et ce serveur
// assemble le payload strict de façon DÉTERMINISTE (catalogue de templates
// recopié de CardCatalog, champs requis toujours émis).
//
// Ce que la photo ne porte pas ne s'invente pas : SLA/SLSA/SLM, date de décès,
// types de Gu, consultanteId restent absents. Un graphe partiel est honnête ;
// un graphe deviné est faux.
//
// Gate (DEC Patrick) : 3 imports d'essai par utilisatrice, puis inclus dans
// l'abonnement. L'AUTORITÉ est ici (le compteur app est informatif) : 402 quand
// les essais sont épuisés et qu'aucun plan actif n'existe. Source de vérité
// abonnement = Supabase praticienne_app_plan — JAMAIS le webhook Make
// (déprécié comme source de vérité, DEC Patrick 2026-05-27).

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = "claude-sonnet-5"; // un tier vision suffit (image ~4k jetons, JSON ~3k)
const ESSAIS_GRATUITS = 3;

// ── Catalogue de templates — copie serveur de CardCatalog (AuditEntitesModels.swift).
// Les 8 champs de CardTemplate, valeurs identiques. Ne pas « améliorer » : le
// Swift compare/décode ces valeurs telles quelles.
type Template = {
  id: string; icon: string; name: string; color: string;
  gender: string; lignee: string; generation: number; relation_type: string;
};
const CATALOG: Record<string, Template> = {
  "consultante": { id: "consultante", icon: "👤", name: "Consultante", color: "#8B3A62", gender: "F", lignee: "consultante", generation: 0, relation_type: "consultante" },
  "pere": { id: "pere", icon: "👨", name: "Père", color: "#2196F3", gender: "M", lignee: "paternelle", generation: 1, relation_type: "père" },
  "mere": { id: "mere", icon: "👩", name: "Mère", color: "#E91E63", gender: "F", lignee: "maternelle", generation: 1, relation_type: "mère" },
  "fils": { id: "fils", icon: "👦", name: "Fils", color: "#0D9488", gender: "M", lignee: "consultante", generation: -1, relation_type: "fils" },
  "fille": { id: "fille", icon: "👧", name: "Fille", color: "#DB2777", gender: "F", lignee: "consultante", generation: -1, relation_type: "fille" },
  "petit-fils": { id: "petit-fils", icon: "🧒", name: "Petit-fils", color: "#0EA5E9", gender: "M", lignee: "consultante", generation: -2, relation_type: "petit-fils" },
  "petite-fille": { id: "petite-fille", icon: "🧒", name: "Petite-fille", color: "#F472B6", gender: "F", lignee: "consultante", generation: -2, relation_type: "petite-fille" },
  "guide-lumiere": { id: "guide-lumiere", icon: "✨", name: "Guide de Lumière", color: "#F59E0B", gender: "F", lignee: "consultante", generation: 2, relation_type: "guide de lumière" },
  "ancetre-guide": { id: "ancetre-guide", icon: "👴", name: "Ancêtre Guide", color: "#6366F1", gender: "M", lignee: "paternelle", generation: 3, relation_type: "ancêtre guide" },
  "source-divine": { id: "source-divine", icon: "☀️", name: "Source Divine", color: "#FBBF24", gender: "F", lignee: "consultante", generation: 120, relation_type: "source divine" },
  "mentor-m": { id: "mentor-m", icon: "🎓", name: "Mentor", color: "#0EA5E9", gender: "M", lignee: "paternelle", generation: 1, relation_type: "mentor" },
  "enseignant": { id: "enseignant", icon: "📚", name: "Enseignant·e", color: "#F97316", gender: "F", lignee: "consultante", generation: 1, relation_type: "enseignant" },
  "therapeute": { id: "therapeute", icon: "💆", name: "Thérapeute", color: "#14B8A6", gender: "F", lignee: "consultante", generation: 0, relation_type: "thérapeute" },
  "grand-pere": { id: "grand-pere", icon: "👴", name: "Grand-père", color: "#3F51B5", gender: "M", lignee: "ancestrale", generation: 2, relation_type: "grand-père" },
  "grand-mere": { id: "grand-mere", icon: "👵", name: "Grand-mère", color: "#9C27B0", gender: "F", lignee: "ancestrale", generation: 2, relation_type: "grand-mère" },
  "arriere-grand-pere": { id: "arriere-grand-pere", icon: "👴", name: "Arrière-grand-père", color: "#5E35B1", gender: "M", lignee: "ancestrale", generation: 3, relation_type: "arrière-grand-père" },
  "arriere-grand-mere": { id: "arriere-grand-mere", icon: "👵", name: "Arrière-grand-mère", color: "#673AB7", gender: "F", lignee: "ancestrale", generation: 3, relation_type: "arrière-grand-mère" },
  "oncle": { id: "oncle", icon: "🧔", name: "Oncle", color: "#00897B", gender: "M", lignee: "collaterale", generation: 1, relation_type: "oncle" },
  "tante": { id: "tante", icon: "👩", name: "Tante", color: "#AD1457", gender: "F", lignee: "collaterale", generation: 1, relation_type: "tante" },
  "arriere-grand-oncle": { id: "arriere-grand-oncle", icon: "👴", name: "Arrière-grand-oncle", color: "#00695C", gender: "M", lignee: "collaterale", generation: 3, relation_type: "arrière-grand-oncle" },
  "arriere-grand-tante": { id: "arriere-grand-tante", icon: "👵", name: "Arrière-grand-tante", color: "#880E4F", gender: "F", lignee: "collaterale", generation: 3, relation_type: "arrière-grand-tante" },
};
const SHAPES = new Set(["soleil", "circle", "tetrahedron", "cube", "octahedron", "dodecahedron", "icosahedron"]);
const STATES = new Set(["absente", "bloquée", "active", "libérée"]);
const MERIDIENS = new Set(["LU", "LI", "ST", "SP", "HT", "SI", "BL", "KI", "PC", "TE", "GB", "LR"]);

// ── Prompt de lecture — le canva a été instrumenté exprès pour la capture.
const SYSTEM = `Tu lis la CAPTURE D'ÉCRAN d'un canva d'audit d'entités SVLBH et tu en extrais un JSON.

COMMENT LIRE CHAQUE CARTE :
- Le TYPE se lit par l'émoji et le libellé sous le cercle. Types valides (id → émoji/nom) :
${Object.values(CATALOG).map((t) => `  ${t.id} → ${t.icon} ${t.name}`).join("\n")}
- La POSITION : donne x et y NORMALISÉS entre 0 et 1 (0,0 = coin haut-gauche du canva).
- L'ÉTAT est écrit sous le nom : absente · bloquée · active · libérée.
- Le NIVEAU est le nombre dans la petite pastille en haut de la carte (à 12 h ; les
  arrière-grands-parents la portent à 2 h). S'il n'est pas lisible, omets "niveau".
- Le SCORE est le pourcentage en violet sous la carte. S'il n'est pas lisible, omets-le.
- La CLÉ CHROMATIQUE : seul le code hex ÉCRIT sous la carte fait foi (ex. #2B5EA7).
  N'échantillonne JAMAIS la couleur d'une pastille : le JPEG la fausse.
- Les GU : une ligne commençant par 鬼 liste des codes méridiens (LU LI ST SP HT SI BL KI PC TE GB LR).
- Le PRÉNOM/NOM : uniquement s'ils sont lisibles en entier. Tronqué = "".
- Le MOTIF de l'audit est le texte du champ « Raison de l'audit d'entités » s'il est rempli.

CE QUE TU N'INVENTES JAMAIS : scores non lisibles, dates de décès, types de Gu, identités
tronquées. Un graphe partiel est honnête ; un graphe deviné est faux.

RÉPONDS UNIQUEMENT avec un objet JSON (aucun texte autour, pas de balises de code) :
{
  "motif": "",
  "cards": [
    { "type": "<id du catalogue>", "prenom": "", "nom": "", "state": "absente",
      "niveau": 1, "scorePct": 227, "cleChromatiqueHex": "#RRGGBB",
      "sexe": "F", "shape": "circle", "layer": "F",
      "pos": { "x": 0.42, "y": 0.31 }, "guMeridiens": ["LR", "SP"] }
  ],
  "connections": [ { "a": 0, "b": 1 } ]
}
Omets toute clé illisible (sauf "type" et "pos", obligatoires). "connections" relie les
index de "cards" quand un trait est clairement visible entre deux cartes, sinon [].`;

type RawCard = {
  type?: string; prenom?: string; nom?: string; state?: string; niveau?: number;
  scorePct?: number; cleChromatiqueHex?: string; sexe?: string; shape?: string;
  layer?: string; pos?: { x?: number; y?: number }; guMeridiens?: string[];
};
type RawOut = { motif?: string; cards?: RawCard[]; connections?: { a?: number; b?: number }[] };

const CANVAS_W = 1400;
const CANVAS_H = 900;

function clamp01(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 0.5;
  return Math.min(1, Math.max(0, n));
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Assemble une GraphCard STRICTE — chaque champ non optionnel du Swift est émis.
function buildCard(raw: RawCard, i: number) {
  const t = CATALOG[str(raw.type)];
  if (!t) return null;
  const hex = /^#[0-9A-Fa-f]{6}$/.test(str(raw.cleChromatiqueHex)) ? str(raw.cleChromatiqueHex).toUpperCase() : "";
  const gu = (Array.isArray(raw.guMeridiens) ? raw.guMeridiens : [])
    .map((m) => str(m).toUpperCase())
    .filter((m) => MERIDIENS.has(m))
    .map((m, j) => ({ id: `photo-gu-${i + 1}-${j + 1}`, meridien: m, label: "", libere: false, type: "" }));
  const card: Record<string, unknown> = {
    id: `photo-${i + 1}`,
    template: t,
    niveau: Number.isInteger(raw.niveau) ? (raw.niveau as number) : t.generation,
    xOrder: i,
    prenom: str(raw.prenom),
    nom: str(raw.nom),
    state: STATES.has(str(raw.state)) ? str(raw.state) : "absente",
    purpose: "soul_mission",
    sexe: str(raw.sexe) === "M" || str(raw.sexe) === "F" ? str(raw.sexe) : t.gender,
    shape: SHAPES.has(str(raw.shape)) ? str(raw.shape) : "circle",
    layer: str(raw.layer) === "M1" ? "M1" : "F",
    beau: false,
    pos: { x: Math.round(clamp01(raw.pos?.x) * CANVAS_W), y: Math.round(clamp01(raw.pos?.y) * CANVAS_H) },
    annotations: [],
    gu,
    soin: [],
    refugees: [],
    cleChromatique: hex,
    consultanteId: "",
    defunt: false,
    dateDeces: "",
    situationDesincarne: "",
    appartenance: "",
  };
  if (typeof raw.scorePct === "number" && Number.isFinite(raw.scorePct) && raw.scorePct >= 0) {
    card.scoreLumiere = raw.scorePct; // le SLSA peut dépasser 100 % — jamais borné.
  }
  return card;
}

export async function POST(req: Request) {
  const secret = process.env.CERCLE_TRANSFER_SECRET ?? "";
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!secret || !anthropicKey) {
    return NextResponse.json({ error: "Service non configuré côté serveur." }, { status: 500 });
  }
  if (req.headers.get("x-cercle-secret") !== secret) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return NextResponse.json(
      { error: "Connexion requise — ouvre une session dans l'app puis réessaie." },
      { status: 401 },
    );
  }
  const admin = createAdminClient();
  const {
    data: { user },
    error: authErr,
  } = await admin.auth.getUser(m[1]);
  if (authErr || !user) {
    return NextResponse.json(
      { error: "Session expirée — reconnecte-toi puis réessaie." },
      { status: 401 },
    );
  }

  // ── Gate : plan actif (Supabase, JAMAIS Make) sinon 3 essais.
  const { data: profil } = await admin
    .from("praticienne_profile")
    .select("svlbh_id")
    .eq("supabase_user_id", user.id)
    .maybeSingle();
  let abonnee = false;
  if (profil?.svlbh_id) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: plans } = await admin
      .from("praticienne_app_plan")
      .select("status, end_period")
      .eq("praticienne_svlbh_id", profil.svlbh_id)
      .eq("status", "active");
    abonnee = (plans ?? []).some((p) => !p.end_period || p.end_period >= today);
  }
  if (!abonnee) {
    const { count } = await admin
      .from("graphe_photo_imports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= ESSAIS_GRATUITS) {
      return NextResponse.json(
        { error: "Tes imports d'essai sont épuisés. L'import photo est inclus dans l'abonnement." },
        { status: 402 },
      );
    }
  }

  // ── Entrée.
  let body: { image_base64?: string; mime?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON illisible." }, { status: 400 });
  }
  const image = str(body.image_base64);
  const mime = ["image/jpeg", "image/png", "image/webp"].includes(str(body.mime)) ? str(body.mime) : "image/jpeg";
  if (!image) {
    return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
  }

  // ── Vision.
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mime, data: image } },
            { type: "text", text: "Lis ce canva d'audit et rends le JSON." },
          ],
        },
      ],
    }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    console.error("[graphe-photo] anthropic", resp.status, detail.slice(0, 300));
    return NextResponse.json(
      { error: "La lecture de l'image a échoué côté modèle — réessaie dans un instant." },
      { status: 502 },
    );
  }
  const out = (await resp.json()) as { content?: { type: string; text?: string }[] };
  const texte = (out.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  let raw: RawOut;
  try {
    raw = JSON.parse(texte.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, ""));
  } catch {
    return NextResponse.json({ error: "Aucun graphe n'a pu être lu sur cette image." }, { status: 200 });
  }

  // ── Assemblage strict.
  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .map((c, i) => buildCard(c, i))
    .filter((c): c is NonNullable<typeof c> => c !== null);
  if (cards.length === 0) {
    return NextResponse.json({ error: "Aucune carte reconnue sur cette image." }, { status: 200 });
  }
  const connections = (Array.isArray(raw.connections) ? raw.connections : [])
    .filter((c) => Number.isInteger(c.a) && Number.isInteger(c.b))
    .filter((c) => (c.a as number) >= 0 && (c.a as number) < cards.length && (c.b as number) >= 0 && (c.b as number) < cards.length && c.a !== c.b)
    .map((c, i) => ({
      id: `photo-conn-${i + 1}`,
      a: cards[c.a as number].id as string,
      b: cards[c.b as number].id as string,
      color: "#a289f0",
      token: "",
      sephirot: "",
      situationDesincarne: "",
    }));

  const canvas_graph = {
    cards,
    connections,
    layers: [
      { id: "F", name: "♀ Féminine", side: "F", opacity: 1, visible: true },
      { id: "M1", name: "♂ Masculine 1", side: "M", opacity: 0.55, visible: true },
    ],
    canvasColor: "#e0dde9",
    viewMode: "generations",
    famille: { tokenVoyelles: "", vifa: "", events: [] },
    monades: [],
    motif: str(raw.motif),
    planete: "",
  };

  // Un essai n'est consommé que quand un graphe est réellement rendu.
  await admin.from("graphe_photo_imports").insert({ user_id: user.id, cards: cards.length });

  return NextResponse.json({ canvas_graph });
}
