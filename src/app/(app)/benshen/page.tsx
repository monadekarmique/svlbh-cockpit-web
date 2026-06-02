"use client";

// Benshen / Chrono-Acupuncture — écran centré sur le point GB13 Benshen 本神.
// 1) Configured Time (date/heure + lieu) → True Local Time live
// 2) The Four Pillars / Bazi (Heure · Jour · Mois · Année)
// 3) Acupoints chrono-optimaux (Linggui Bafa) + Najia (esquisse)
// 4) Carte GB13 Benshen
// 5) Sélecteur de méridien (12 organes Zi Wu Liu Zhu + 8 vaisseaux extraordinaires)

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PLACES,
  DEFAULT_PLACE,
  fourPillars,
  ganZhiPinyin,
  ganZhiZh,
  trueLocalTimeCorrectionSeconds,
  utcOffsetSeconds,
  toTrueLocalTime,
  formatCorrection,
  najiaHint,
  ORGAN_MERIDIANS,
  EXTRA_VESSELS,
  type Pillar,
  type WuXing,
} from "@/lib/cercle/bazi";
import { bafaForDate } from "@/lib/cercle/linggui-bafa";
import { BENSHEN } from "@/lib/cercle/benshen";

// Couleur tonale par élément (cohérent avec le reste du cockpit).
const ELEMENT_TONE: Record<WuXing, { border: string; bg: string; text: string }> = {
  Bois: { border: "#4A7C3F", bg: "#EAF3DE", text: "#27500A" },
  Feu: { border: "#D85A30", bg: "#FAECE7", text: "#4A1B0C" },
  Terre: { border: "#BA7517", bg: "#FAEEDA", text: "#633806" },
  Métal: { border: "#888780", bg: "#F1EFE8", text: "#444441" },
  Eau: { border: "#185FA5", bg: "#E6F1FB", text: "#042C53" },
};

// Pinyin Bafa → traduction « courante »
const BAFA_TRANSLATION: Record<string, string> = {
  gongsun: "grandfather grandson",
  neiguan: "inner pass",
  houxi: "back stream",
  shenmo: "extending vessel",
  waiguan: "outer pass",
  linqi: "falling tears",
  zhaohai: "shining sea",
  lieque: "broken sequence",
};

/** Convertit la valeur d'un <input type="datetime-local"> en Date (heure locale navigateur). */
function parseLocalInput(value: string): Date {
  // value = "YYYY-MM-DDTHH:mm" — interprété comme heure locale du navigateur.
  return new Date(value);
}

/** Formate une Date en valeur <input type="datetime-local"> (heure locale navigateur). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BenshenPage() {
  // Date/heure configurée (instant absolu). Initialisée côté client pour éviter
  // tout mismatch d'hydratation avec l'heure du serveur.
  const [configured, setConfigured] = useState<Date | null>(null);
  const [placeIndex, setPlaceIndex] = useState(0);
  const [meridianKey, setMeridianKey] = useState<string>("GB"); // GB par défaut (Benshen)

  useEffect(() => {
    setConfigured(new Date());
  }, []);

  const place = PLACES[placeIndex] ?? DEFAULT_PLACE;

  const computed = useMemo(() => {
    if (!configured) return null;
    const offset = utcOffsetSeconds(place.timeZone, configured);
    const correction = trueLocalTimeCorrectionSeconds(place.longitude, offset);
    const tlt = toTrueLocalTime(configured, place.longitude, place.timeZone);
    const pillars = fourPillars(configured, place.longitude, place.timeZone);
    const bafa = bafaForDate(
      new Date(Date.UTC(pillars.parts.year, pillars.parts.month - 1, pillars.parts.day)),
      pillars.parts.hour,
    );
    return { correction, tlt, pillars, bafa };
  }, [configured, place]);

  if (!configured || !computed) {
    return (
      <div className="space-y-5">
        <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Cockpit
        </Link>
        <p className="text-sm text-neutral-500">Chargement de l&apos;horloge…</p>
      </div>
    );
  }

  const { correction, tlt, pillars, bafa } = computed;
  const pillarsOrdered: Pillar[] = [pillars.hour, pillars.day, pillars.month, pillars.year];

  const selectedOrgan = ORGAN_MERIDIANS.find((m) => m.code === meridianKey);
  const selectedVessel = EXTRA_VESSELS.find((v) => v.code === meridianKey);

  return (
    <div className="space-y-5">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Cockpit
      </Link>

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          🧠 Benshen · Chrono-Acupuncture
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Point <span className="font-semibold">GB13 本神 « Racine de l&apos;Esprit »</span> · Quatre
          Piliers Bazi (四柱) en vrai temps solaire local + acupoints chrono-optimaux.
        </p>
      </header>

      {/* ── 1. Configured Time / True Local Time ──────────────────────────── */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-600">
          Configured Time
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold text-neutral-700">Date &amp; heure</span>
            <input
              type="datetime-local"
              value={toLocalInput(configured)}
              onChange={(e) => {
                const d = parseLocalInput(e.target.value);
                if (!Number.isNaN(d.getTime())) setConfigured(d);
              }}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-neutral-700">Lieu</span>
            <select
              value={placeIndex}
              onChange={(e) => setPlaceIndex(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {PLACES.map((p, i) => (
                <option key={p.timeZone} value={i}>
                  {p.label} · lon {p.longitude.toFixed(2)}°
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
            True Local Time · {place.label}
          </p>
          <p className="mt-0.5 font-mono text-2xl font-extrabold tabular-nums text-amber-900">
            {tlt.toLocaleTimeString("fr-CH", {
              timeZone: "UTC",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
          <p className="text-[11px] text-amber-800">
            {tlt.toLocaleDateString("fr-CH", {
              timeZone: "UTC",
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-1 font-mono text-[10px] text-amber-700">
            Correction = lon/15·3600 = {formatCorrection(correction)}
          </p>
        </div>
      </section>

      {/* ── 2. Les Quatre Piliers / Bazi ─────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold text-blue-900">
          The Four Pillars · Bazi 四柱
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {pillarsOrdered.map((p) => {
            const tone = ELEMENT_TONE[p.zhi.element];
            return (
              <div
                key={p.key}
                className="rounded-xl border-2 p-2 text-center"
                style={{ borderColor: tone.border, backgroundColor: tone.bg }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tone.border }}>
                  {p.label}
                </p>
                <p className="mt-1 text-2xl font-extrabold leading-none" style={{ color: tone.text }}>
                  {ganZhiZh(p)}
                </p>
                <p className="mt-1 text-[11px] italic" style={{ color: tone.text }}>
                  {ganZhiPinyin(p)}
                </p>
                <p className="text-[10px] font-semibold" style={{ color: tone.border }}>
                  {p.zhi.animalEn}
                </p>
                <p className="text-[9px] text-neutral-600">
                  {p.gan.element} · {p.zhi.element}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-neutral-500">
          Bornes des termes solaires approximées par dates fixes (Lìchūn ≈ 4 févr., etc.) —
          précision ±1 j autour des bornes.
        </p>
      </section>

      {/* ── 3. Acupoints chrono-optimaux (Linggui Bafa) ──────────────────── */}
      <section className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <h2 className="text-base font-semibold text-amber-900">
          Acupoints chrono-optimaux · Linggui Bafa 灵龟八法
        </h2>
        <p className="text-[11px] text-amber-800">
          Créneau {bafa.hourLabel} · {bafa.diZhiName} · jour Tian Gan {bafa.tianGanName}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <BafaCard label="Point principal" code={bafa.upper.code} pinyin={bafa.upper.pinyin} vessel={bafa.upper.vessel} />
          <BafaCard label="Point combiné" code={bafa.lower.code} pinyin={bafa.lower.pinyin} vessel={bafa.lower.vessel} />
        </div>
        <p className="mt-1 text-[11px] text-amber-800">
          <span className="font-semibold">Najia 纳甲</span> : (selon troncs du jour) —{" "}
          {najiaHint(pillars)}
        </p>
      </section>

      {/* ── 4. Carte GB13 Benshen ────────────────────────────────────────── */}
      <section className="space-y-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-4 shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-extrabold text-emerald-700">{BENSHEN.code}</span>
          <span className="text-2xl font-bold text-emerald-900">{BENSHEN.zh}</span>
          <span className="text-sm italic text-emerald-800">{BENSHEN.pinyin}</span>
        </div>
        <p className="text-base font-semibold text-emerald-900">« {BENSHEN.translation} »</p>
        <p className="text-[11px] font-semibold text-emerald-700">{BENSHEN.meridian}</p>
        <div className="rounded-lg border border-emerald-200 bg-white/70 p-2">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Localisation</p>
          <p className="text-xs text-neutral-800">{BENSHEN.location}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-emerald-700">Fonctions principales</p>
          <ul className="mt-1 space-y-1">
            {BENSHEN.functions.map((f) => (
              <li key={f} className="text-xs text-neutral-800">
                • {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[10px] italic text-neutral-500">
          Contenu MTC standard — usage formation, pas de revendication médicale grand public.{" "}
          {BENSHEN.svlbhNote}
        </p>
      </section>

      {/* ── 5. Sélecteur de méridien ─────────────────────────────────────── */}
      <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-blue-900">
          Méridien → horaire d&apos;ouverture &amp; points clés
        </h2>
        <label className="block">
          <span className="text-[11px] font-semibold text-neutral-700">Choisir un méridien</span>
          <select
            value={meridianKey}
            onChange={(e) => setMeridianKey(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <optgroup label="12 méridiens d'organes (Zi Wu Liu Zhu)">
              {ORGAN_MERIDIANS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} · {m.name} ({m.hourLabel})
                </option>
              ))}
            </optgroup>
            <optgroup label="8 vaisseaux extraordinaires (Linggui Bafa)">
              {EXTRA_VESSELS.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.code} ({v.pinyin})
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        {selectedOrgan ? (
          <div
            className="rounded-xl border-2 p-3"
            style={{
              borderColor: ELEMENT_TONE[selectedOrgan.element].border,
              backgroundColor: ELEMENT_TONE[selectedOrgan.element].bg,
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-lg font-bold" style={{ color: ELEMENT_TONE[selectedOrgan.element].text }}>
                {selectedOrgan.zh} {selectedOrgan.name}
              </p>
              <span className="font-mono text-xs font-bold" style={{ color: ELEMENT_TONE[selectedOrgan.element].border }}>
                {selectedOrgan.code}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: ELEMENT_TONE[selectedOrgan.element].border }}>
              {selectedOrgan.pinyin} · {selectedOrgan.element}
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: ELEMENT_TONE[selectedOrgan.element].text }}>
              Ouverture : {selectedOrgan.hourLabel}
            </p>
            <div className="mt-2 space-y-1 border-t border-black/10 pt-2">
              <p className="text-[10px] font-bold uppercase" style={{ color: ELEMENT_TONE[selectedOrgan.element].border }}>
                Points clés
              </p>
              {selectedOrgan.keyPoints.map((kp) => (
                <p key={kp.code} className="text-xs text-neutral-800">
                  <span className="font-mono font-bold">{kp.code}</span> — {kp.role}
                </p>
              ))}
            </div>
          </div>
        ) : selectedVessel ? (
          <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-indigo-900">
                {selectedVessel.zh} {selectedVessel.code}
              </p>
              <span className="text-xs italic text-indigo-700">{selectedVessel.pinyin}</span>
            </div>
            <p className="mt-1 text-sm font-bold text-indigo-900">
              Ouverture : variable — Linggui Bafa
            </p>
            <div className="mt-2 space-y-1 border-t border-indigo-200 pt-2">
              <p className="text-[10px] font-bold uppercase text-indigo-700">Point de confluence</p>
              <p className="text-xs text-neutral-800">
                <span className="font-mono font-bold">{selectedVessel.confluencePoint}</span>
              </p>
              <p className="text-[11px] text-neutral-600">
                Couplé avec : {selectedVessel.pairedWith}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Référence : traductions Bafa (lecture rapide) */}
      <section className="space-y-1">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Lexique pinyin Bafa
        </h2>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-neutral-500 sm:grid-cols-4">
          {Object.entries(BAFA_TRANSLATION).map(([k, v]) => (
            <li key={k}>
              <span className="italic">{k}</span> · {v}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function BafaCard({
  label,
  code,
  pinyin,
  vessel,
}: {
  label: string;
  code: string;
  pinyin: string;
  vessel: string;
}) {
  const translation = BAFA_TRANSLATION[pinyin];
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-amber-800">{code}</p>
      <p className="text-xs italic text-neutral-700">
        {pinyin}
        {translation ? ` · ${translation}` : ""}
      </p>
      <p className="text-[11px] font-semibold text-blue-900">{vessel}</p>
    </div>
  );
}
