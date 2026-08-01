// /hdom — Décodage hDOM paramétrable, réservé ST5+.
//
// DEC Patrick 2026-08-01 : le spécimen figé vit derrière le gate
// patrick-bays.svlbh.com ; ICI c'est la version de travail — « un formulaire
// que l'utilisateur remplit par radiesthésie ».
//
// Ce que le portage a changé par rapport à l'extension Chrome v1.2 :
//  · l'en-tête du cas (nom, SLA, générations, fork, méridien dominant) était
//    écrit EN DUR pour un cas de diabète — il devient saisissable ;
//  · le panneau ne gardait RIEN : fermer l'onglet perdait la séance. L'état
//    est désormais persisté sur l'appareil (localStorage), avec export JSON ;
//  · l'appel `chrome.runtime` du pont Claude est sous garde `typeof`.
// Les onglets Décodage G. / Pierres / 33 Chakras étaient DÉJÀ des formulaires
// vides — ce sont eux que la praticienne remplit au pendule.
//
// Le moteur est servi par la route sœur /hdom/panel.js, gatée identiquement :
// il porte le vocabulaire réservé, il ne peut pas vivre dans public/.

import { readFile } from "node:fs/promises";
import path from "node:path";
import Script from "next/script";
import { requireSt5Plus } from "@/lib/owner-gate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Décodage hDOM — Cockpit SVLBH",
  robots: { index: false, follow: false },
};

async function lire(nom: string) {
  return readFile(path.join(process.cwd(), "src/app/(app)/hdom", nom), "utf8");
}

export default async function HdomPage() {
  const { stx } = await requireSt5Plus();
  const [css, body] = await Promise.all([
    lire("_panel.css.txt"),
    lire("_panel.body.txt"),
  ]);

  return (
    <div className="hdom-root">
      <style dangerouslySetInnerHTML={{ __html: css + EXTRA_CSS }} />

      <div className="hdom-bar">
        <div>
          <strong>Décodage hDOM</strong> — version de travail ·{" "}
          <span className="hdom-stx">{stx}</span>
        </div>
        <div className="hdom-bar-right">
          <span id="hdom-saved" className="hdom-saved" />
          <button type="button" data-hdom="export" className="hdom-btn">
            Exporter la séance (JSON)
          </button>
          <button type="button" data-hdom="reset" className="hdom-btn hdom-btn-danger">
            Nouvelle séance
          </button>
        </div>
      </div>

      <p className="hdom-note">
        Les valeurs se saisissent au pendule, onglet par onglet. Tout est
        enregistré sur cet appareil au fur et à mesure — rien n&apos;est envoyé au
        serveur. « Nouvelle séance » efface la saisie en cours.
      </p>

      <div dangerouslySetInnerHTML={{ __html: body }} />

      <Script src="/hdom/panel.js" strategy="afterInteractive" />
    </div>
  );
}

// Habillage propre au cockpit : la barre d'outils, le formulaire d'en-tête et
// la note. Le reste du style vient tel quel du panneau d'origine.
const EXTRA_CSS = `
.hdom-root{max-width:1040px;margin:0 auto}
.hdom-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;
  flex-wrap:wrap;padding:10px 14px;margin-bottom:8px;border-radius:10px;
  background:var(--bg1,#fff);border:0.5px solid var(--bd2,rgba(44,44,42,.22))}
.hdom-bar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.hdom-stx{font-size:11px;font-weight:600;padding:1px 8px;border-radius:10px;
  background:rgba(16,163,127,.14);color:#0f6e56}
.hdom-saved{font-size:10px;color:var(--t3,#9c9a92);min-width:96px;text-align:right}
.hdom-btn{font-size:11px;font-weight:500;padding:5px 13px;border-radius:8px;cursor:pointer;
  border:0.5px solid var(--bd2,rgba(44,44,42,.22));background:var(--bg2,#f8f8f6);
  color:var(--t1,#1a1a18);font-family:'Source Sans 3',sans-serif}
.hdom-btn:hover{background:var(--bg1,#fff)}
.hdom-btn-danger{color:#A32D2D;border-color:rgba(163,45,45,.4)}
.hdom-note{font-size:11px;color:var(--t2,#5f5e5a);margin:0 2px 14px;line-height:1.6}
.hdom-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:10px 0}
.hdom-form label{display:flex;flex-direction:column;gap:3px;font-size:9px;font-weight:600;
  text-transform:uppercase;letter-spacing:.05em;color:var(--t2,#5f5e5a)}
.hdom-form input{border:0.5px solid var(--bd2,rgba(44,44,42,.22));border-radius:6px;
  background:var(--bg1,#fff);color:var(--t1,#1a1a18);font-size:12px;padding:5px 8px;
  font-family:'Source Sans 3',sans-serif}
.hdom-form input:focus{outline:none;border-color:#185FA5}
`;
