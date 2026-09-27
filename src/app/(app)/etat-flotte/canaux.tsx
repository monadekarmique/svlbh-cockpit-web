import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// LA CHAÎNE DES CANAUX — DEC Patrick 27.09.2026 : « ferme 1, 2, 3 », puis, devant
// cette page : « je ne vois rien concernant les canaux dans l'état de la flotte ? ».
//
// Le verdict de la chaîne (nuit_des_fils.sh, 9 passages par jour) ne vivait que
// dans un fichier du MacBook Pro. z5 est resté rouge huit jours sans que rien ne
// le montre ici.
//
// LES DONNÉES : personne ne les saisit. `public.canaux_releve` n'a aucune policy
// d'écriture ; seule la chaîne y pose un relevé, à la fin de chaque passage, par
// `publier_verdict.py`. Un relevé ne se corrige jamais : le suivant le remplace.
//
// Cette section n'affiche que ce que la chaîne a mesuré. Elle ne calcule aucun
// verdict : « rouge » est décidé par la chaîne, pas par l'écran.
// ─────────────────────────────────────────────────────────────────────────────

// La chaîne passe au plus toutes les 4 h 30 (23h30 → 04h00). Au-delà de 6 h sans
// verdict, elle n'a pas tourné ou n'a pas fini : le dernier verdict ne dit plus
// l'état présent.
const SEUIL_FRAICHEUR_MIN = 6 * 60;

type Etape = { nom: string; code: number };
type Contenu = {
  passage_debut?: string | null;
  etapes?: Etape[];
  verdict?: string[];
  ecoute?: string[];
};
type Releve = {
  pris_le: string; par: string; hote: string | null;
  rouge: boolean; age_minutes: number; contenu: Contenu;
};

function ageLisible(min: number): string {
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default async function CanauxSection() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_canaux_dernier")
    .select("pris_le, par, hote, rouge, age_minutes, contenu")
    .maybeSingle<Releve>();

  // Une section qui n'a rien reçu le DIT. Une absence de verdict n'est pas un
  // verdict vert.
  if (error || !data) {
    return (
      <section>
        <h2 className="font-medium">Chaîne des canaux</h2>
        <p className="mt-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Aucun verdict lisible. Rien à déduire sur les canaux.
          {error ? <span className="mt-1 block opacity-80">({error.message})</span> : null}
        </p>
      </section>
    );
  }

  const c = data.contenu ?? {};
  const etapes = c.etapes ?? [];
  const perimee = data.age_minutes > SEUIL_FRAICHEUR_MIN;
  const ton = perimee || data.rouge ? "bg-rose-50" : "bg-emerald-50";

  return (
    <section>
      <h2 className="font-medium">Chaîne des canaux</h2>
      <p className={`mt-2 inline-block rounded-md px-3 py-1.5 text-sm ${
          perimee ? "bg-rose-100 text-rose-900" : "bg-neutral-100 text-neutral-700"}`}>
        {perimee ? "⚠️ Verdict ancien, la chaîne n’a pas tourné ou n’a pas fini — " : ""}
        Rendu {ageLisible(data.age_minutes)} par <code>{data.par}</code>
        {data.hote ? ` sur ${data.hote}` : ""} ·{" "}
        {new Date(data.pris_le).toLocaleString("fr-CH", { timeZone: "Europe/Zurich" })}
      </p>

      <div className={`mt-3 rounded-xl p-4 ${ton}`}>
        {(c.verdict ?? []).map((l, i) => (
          <p key={i} className={`text-sm ${/^\s/.test(l) ? "pl-4" : "font-medium"} ${
              data.rouge ? "text-rose-900" : "text-emerald-900"}`}>
            {l.trim()}
          </p>
        ))}
      </div>

      {etapes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {etapes.map((e) => (
            <li key={e.nom} className={`rounded-md border px-2.5 py-1 ${
                e.code === 0 ? "border-neutral-200 text-neutral-700"
                             : "border-rose-300 bg-rose-50 font-medium text-rose-800"}`}>
              {e.nom} {e.code === 0 ? "✓" : `⛔ code ${e.code}`}
            </li>
          ))}
        </ul>
      )}

      {(c.ecoute?.length ?? 0) > 0 && (
        <>
          <h3 className="mt-4 text-sm font-medium text-neutral-700">
            Écoute des ponts — dernier message reçu
          </h3>
          <ul className="mt-1 space-y-0.5 text-sm">
            {c.ecoute!.map((l, i) => (
              <li key={i} className={l.startsWith("⛔") ? "font-medium text-rose-800" : "text-neutral-600"}>
                {l}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        Un pont « connecté » peut ne plus rien recevoir : c’est l’écoute qui le dit. Un écart sur
        lequel Patrick a tranché reste affiché en rouge, avec sa décision sur la ligne.
      </p>
    </section>
  );
}
