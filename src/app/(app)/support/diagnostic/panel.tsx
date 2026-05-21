"use client";

// Panneau diagnostic technique — 5 mesures auto.
// Brief v2 — DEC Patrick 2026-05-21.
// Mesure : RTT réseau, Upload, Download, Type de NAT, Browser + H.264 hw.

import { useState } from "react";

type Level = "GREEN" | "AMBER" | "RED" | "PENDING" | "ERROR";

type Metric = {
  label: string;
  value: string | null;
  level: Level;
  detail?: string;
};

const LEVEL_TONE: Record<Level, { bg: string; text: string; dot: string; label: string }> = {
  GREEN: { bg: "bg-emerald-50", text: "text-emerald-900", dot: "🟢", label: "OK" },
  AMBER: { bg: "bg-amber-50", text: "text-amber-900", dot: "🟡", label: "Dégradé" },
  RED: { bg: "bg-rose-50", text: "text-rose-900", dot: "🔴", label: "Critique" },
  PENDING: { bg: "bg-neutral-50", text: "text-neutral-500", dot: "⏳", label: "Mesure…" },
  ERROR: { bg: "bg-orange-50", text: "text-orange-900", dot: "⚠", label: "Échec" },
};

const INITIAL: Record<string, Metric> = {
  rtt: { label: "RTT réseau", value: null, level: "PENDING" },
  up: { label: "Upload", value: null, level: "PENDING" },
  down: { label: "Download", value: null, level: "PENDING" },
  nat: { label: "Type de NAT", value: null, level: "PENDING" },
  browser: { label: "Browser + codecs", value: null, level: "PENDING" },
};

function classifyRtt(ms: number): Level {
  if (ms < 50) return "GREEN";
  if (ms <= 200) return "AMBER";
  return "RED";
}
function classifyUp(mbps: number): Level {
  if (mbps > 5) return "GREEN";
  if (mbps >= 1) return "AMBER";
  return "RED";
}
function classifyDown(mbps: number): Level {
  if (mbps > 10) return "GREEN";
  if (mbps >= 2) return "AMBER";
  return "RED";
}

async function measureRtt(): Promise<{ ms: number; level: Level }> {
  const trials = 5;
  const samples: number[] = [];
  for (let i = 0; i < trials; i++) {
    const t0 = performance.now();
    await fetch("/api/ping", { cache: "no-store" });
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  // Trim min/max et moyenne
  const trimmed = samples.slice(1, -1);
  const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
  return { ms: Math.round(avg), level: classifyRtt(avg) };
}

async function measureUpload(): Promise<{ mbps: number; level: Level }> {
  const SIZE = 1 * 1024 * 1024; // 1 MB
  const payload = new Uint8Array(SIZE);
  for (let i = 0; i < SIZE; i += 4096) payload[i] = Math.floor(Math.random() * 256);
  const t0 = performance.now();
  const res = await fetch("/api/speedtest/up", {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/octet-stream" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("upload failed");
  const elapsedMs = performance.now() - t0;
  const mbps = (SIZE * 8) / (elapsedMs / 1000) / 1_000_000;
  return { mbps: Math.round(mbps * 10) / 10, level: classifyUp(mbps) };
}

async function measureDownload(): Promise<{ mbps: number; level: Level }> {
  const t0 = performance.now();
  const res = await fetch("/api/speedtest/down", { cache: "no-store" });
  if (!res.ok) throw new Error("download failed");
  const buf = await res.arrayBuffer();
  const elapsedMs = performance.now() - t0;
  const mbps = (buf.byteLength * 8) / (elapsedMs / 1000) / 1_000_000;
  return { mbps: Math.round(mbps * 10) / 10, level: classifyDown(mbps) };
}

async function measureNat(): Promise<{ type: string; level: Level }> {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const types = new Set<string>();
    let resolved = false;
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const c = e.candidate.candidate.toLowerCase();
        if (c.includes("typ host")) types.add("host");
        if (c.includes("typ srflx")) types.add("srflx");
        if (c.includes("typ relay")) types.add("relay");
      } else {
        if (resolved) return;
        resolved = true;
        pc.close();
        if (types.has("srflx") && !types.has("relay")) {
          resolve({ type: "Full Cone / Restricted (P2P direct)", level: "GREEN" });
        } else if (types.has("srflx")) {
          resolve({ type: "Port Restricted (TURN recommandé)", level: "AMBER" });
        } else if (types.has("host") && !types.has("srflx")) {
          resolve({ type: "Local seulement (pas d'accès Internet ?)", level: "AMBER" });
        } else {
          resolve({ type: "Symmetric / inconnu (TURN obligatoire)", level: "RED" });
        }
      }
    };
    pc.createDataChannel("diag");
    pc.createOffer().then((o) => pc.setLocalDescription(o));
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      pc.close();
      const got = Array.from(types).join(",") || "aucun candidat";
      resolve({ type: `Timeout (${got})`, level: "RED" });
    }, 5000);
  });
}

type BrowserInfo = { label: string; level: Level; h264Hw: boolean };
async function detectBrowser(): Promise<BrowserInfo> {
  const ua = navigator.userAgent;
  let label = "Unknown";
  let level: Level = "AMBER";
  // Détection ordonnée : Edge avant Chrome (Edg/) ; CriOS avant Safari ; Safari après Chrome.
  // Utiliser .match() retourne les groupes (RegExp.$1 est legacy et peu fiable).
  let m: RegExpMatchArray | null;
  if ((m = ua.match(/Edg\/(\d+)/))) {
    const v = parseInt(m[1], 10);
    label = `Edge ${v}`;
    level = v >= 100 ? "GREEN" : "AMBER";
  } else if ((m = ua.match(/CriOS\/(\d+)/))) {
    const v = parseInt(m[1], 10);
    label = `Chrome iOS ${v}`;
    level = v >= 100 ? "GREEN" : "AMBER";
  } else if ((m = ua.match(/FxiOS\/(\d+)/))) {
    label = `Firefox iOS ${m[1]}`;
    level = "AMBER";
  } else if ((m = ua.match(/Chrome\/(\d+)/))) {
    const v = parseInt(m[1], 10);
    label = `Chrome ${v}`;
    level = v >= 100 ? "GREEN" : "AMBER";
  } else if ((m = ua.match(/Firefox\/(\d+)/))) {
    label = `Firefox ${m[1]}`;
    level = "AMBER";
  } else if ((m = ua.match(/Version\/(\d+(?:\.\d+)?)[^)]*Safari/))) {
    const v = parseFloat(m[1]);
    const isMobile = /(iPad|iPhone|iPod|Mobile)/.test(ua);
    label = `Safari ${v}${isMobile ? " (iOS/iPadOS)" : " (macOS)"}`;
    level = v >= 15 ? "GREEN" : "AMBER";
  }
  // H.264 hw via RTCRtpSender.getCapabilities
  let h264Hw = false;
  try {
    const caps = RTCRtpSender.getCapabilities?.("video");
    h264Hw = !!caps?.codecs.some((c) => c.mimeType.toLowerCase().includes("h264"));
  } catch {
    /* empty */
  }
  if (level === "GREEN" && !h264Hw) level = "AMBER";
  return {
    label: `${label}${h264Hw ? " + H.264 hw" : " (pas H.264 détecté)"}`,
    level,
    h264Hw,
  };
}

function overallLevel(metrics: Record<string, Metric>): "GREEN" | "AMBER" | "RED" {
  const levels = Object.values(metrics).map((m) => m.level);
  if (levels.includes("RED")) return "RED";
  if (levels.includes("AMBER")) return "AMBER";
  return "GREEN";
}

function recommendation(metrics: Record<string, Metric>): string[] {
  const recs: string[] = [];
  if (metrics.up?.level === "RED") {
    recs.push("Upload insuffisant pour partage vidéo — passer en WiFi si 4G/5G, déconnecter le VPN, ou contacter Patrick pour activer TURN.");
  } else if (metrics.up?.level === "AMBER") {
    recs.push("Upload dégradé — la qualité vidéo sera réduite.");
  }
  if (metrics.rtt?.level === "RED") {
    recs.push("Latence trop élevée — saturé ou loin du serveur. Tester une autre connexion.");
  }
  if (metrics.nat?.level === "RED") {
    recs.push("NAT symétrique détecté — TURN obligatoire (contacter Patrick).");
  }
  if (metrics.browser?.level !== "GREEN") {
    recs.push("Browser à mettre à jour ou changer pour Chrome/Edge/Safari récent (H.264 hw recommandé).");
  }
  return recs;
}

export function DiagnosticPanel({ sessionId }: { sessionId?: string }) {
  const [metrics, setMetrics] = useState<Record<string, Metric>>(INITIAL);
  const [running, setRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null);

  async function runDiagnostic() {
    setRunning(true);
    setMetrics({ ...INITIAL });

    // RTT
    try {
      const r = await measureRtt();
      setMetrics((m) => ({
        ...m,
        rtt: { ...m.rtt, value: `${r.ms} ms`, level: r.level },
      }));
    } catch {
      setMetrics((m) => ({ ...m, rtt: { ...m.rtt, value: "—", level: "ERROR" } }));
    }

    // Upload
    try {
      const r = await measureUpload();
      setMetrics((m) => ({
        ...m,
        up: { ...m.up, value: `${r.mbps} Mbps`, level: r.level },
      }));
    } catch {
      setMetrics((m) => ({ ...m, up: { ...m.up, value: "—", level: "ERROR" } }));
    }

    // Download
    try {
      const r = await measureDownload();
      setMetrics((m) => ({
        ...m,
        down: { ...m.down, value: `${r.mbps} Mbps`, level: r.level },
      }));
    } catch {
      setMetrics((m) => ({ ...m, down: { ...m.down, value: "—", level: "ERROR" } }));
    }

    // NAT
    try {
      const r = await measureNat();
      setMetrics((m) => ({
        ...m,
        nat: { ...m.nat, value: r.type, level: r.level },
      }));
    } catch {
      setMetrics((m) => ({ ...m, nat: { ...m.nat, value: "—", level: "ERROR" } }));
    }

    // Browser
    try {
      const r = await detectBrowser();
      setMetrics((m) => ({
        ...m,
        browser: { ...m.browser, value: r.label, level: r.level },
      }));
    } catch {
      setMetrics((m) => ({ ...m, browser: { ...m.browser, value: "—", level: "ERROR" } }));
    }

    setLastRunAt(new Date());
    setRunning(false);
  }

  // Log audit dès qu'on a un overall stable et qu'on n'est plus running
  async function logAudit(snapshot: Record<string, Metric>) {
    const level_overall = overallLevel(snapshot);
    const parseMbps = (s: string | null) => {
      if (!s) return null;
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };
    const parseMs = (s: string | null) => {
      if (!s) return null;
      const n = parseInt(s, 10);
      return isNaN(n) ? null : n;
    };
    await fetch("/api/diagnostic/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rtt_ms: parseMs(snapshot.rtt?.value ?? null),
        upload_mbps: parseMbps(snapshot.up?.value ?? null),
        download_mbps: parseMbps(snapshot.down?.value ?? null),
        nat_type: snapshot.nat?.value ?? null,
        browser: snapshot.browser?.value ?? null,
        h264_hw: snapshot.browser?.value?.includes("H.264 hw") ?? false,
        session_id: sessionId ?? null,
        level_overall,
      }),
    }).catch(() => null);
  }

  const overall = overallLevel(metrics);
  const recs = recommendation(metrics);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-bold tracking-tight text-blue-950">
          🩺 Diagnostic technique
        </h2>
        {lastRunAt && (
          <span className="text-[11px] text-neutral-500">
            Dernier test : {lastRunAt.toLocaleTimeString("fr-CH")}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            void runDiagnostic().then(() => {
              // Lire l'état final après les setState
              setMetrics((latest) => {
                void logAudit(latest);
                return latest;
              });
            });
          }}
          disabled={running}
          className="ml-auto rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:bg-neutral-400"
        >
          {running ? "Mesure en cours…" : "▶ Lancer / Relancer"}
        </button>
      </header>

      <div className="rounded-xl border-2 border-neutral-200 bg-white">
        <ul className="divide-y divide-neutral-100">
          {Object.entries(metrics).map(([key, m]) => {
            const tone = LEVEL_TONE[m.level];
            return (
              <li
                key={key}
                className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm ${tone.bg}`}
              >
                <span className="text-lg" aria-hidden>
                  {tone.dot}
                </span>
                <span className="font-semibold text-neutral-800">{m.label}</span>
                <span className="ml-auto font-mono text-sm font-bold text-neutral-900">
                  {m.value ?? (running ? "…" : "—")}
                </span>
                <span className={`text-[10px] font-bold ${tone.text}`}>
                  {tone.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Verdict overall + reco */}
      {!running && Object.values(metrics).every((m) => m.level !== "PENDING") && (
        <div
          className={`rounded-xl border-2 p-4 text-sm ${
            overall === "GREEN"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : overall === "AMBER"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          <p className="font-bold">
            {overall === "GREEN" && "✅ Session de support disponible en P2P direct."}
            {overall === "AMBER" && "⚠ Conditions dégradées — session possible avec qualité réduite."}
            {overall === "RED" && "❌ Conditions insuffisantes pour partage vidéo."}
          </p>
          {recs.length > 0 && (
            <ul className="mt-2 ml-5 list-disc space-y-0.5 text-xs">
              {recs.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-[11px] italic text-neutral-500">
        Diagnostic réservé ST5+ (Admin/Owner). Résultats consignés dans audit_log
        (action <code>DIAGNOSTIC</code>, via <code>cockpit-diagnostic</code>).
      </p>
    </section>
  );
}
