"use client";

// SenderClient — côté praticienne. getDisplayMedia tab-only, RTCPeerConnection,
// signaling Supabase Realtime. Banner sticky en top avec Masquer + Arrêter.
//
// DEC Patrick 2026-05-21 (brief v3 Phase 3 + Addendum v3 masquage).
// REFACTOR Patrick 2026-05-21 :
//   - Banner sticky en top avec actions Masquer + Arrêter (visible toujours)
//   - Masquage côté receiver SEUL (replaceTrack avec canvas noir) — la
//     praticienne continue à voir son onglet localement pour taper son
//     mot de passe en sécurité.

import { useEffect, useRef, useState } from "react";
import {
  openSignaling,
  createPeerConnection,
  type SignalingHandle,
} from "@/lib/support/webrtc-signaling";
import { useSupportSessionStatus } from "@/lib/support/use-session-realtime";
import { logMaskStart, logMaskEnd } from "../../../mask-actions";
import { endSupportSession } from "../../../actions";

type Phase = "idle" | "picking" | "connecting" | "live" | "masked" | "ended" | "error";

function detectShareCapability(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") return { supported: true };
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (
    /Macintosh/.test(ua) && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1
  );
  if (isIOS) {
    return {
      supported: false,
      reason:
        "Apple ne supporte pas le partage d'onglet sur iPad / iPhone (limitation Safari iOS/iPadOS — concerne aussi Chrome iOS, Edge iOS, Firefox iOS qui utilisent tous WebKit). Bascule sur un Mac ou un PC pour démarrer le partage.",
    };
  }
  const isFirefoxAndroid = /Firefox/.test(ua) && /Android/i.test(ua);
  if (isFirefoxAndroid) {
    return {
      supported: false,
      reason:
        "Firefox Android ne supporte pas le partage d'écran (limitation Mozilla mobile). Utilise Chrome Android, Edge Android ou Samsung Internet — ou bascule sur desktop.",
    };
  }
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return {
      supported: false,
      reason:
        "Ton browser ne supporte pas getDisplayMedia. Utilise Chrome, Edge, Firefox ou Safari récent sur desktop.",
    };
  }
  return { supported: true };
}

/** Crée un canvas noir et retourne un MediaStreamTrack vidéo pour replaceTrack. */
function createBlackVideoTrack(): MediaStreamTrack {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  // captureStream(1) = 1 fps suffit pour un écran noir statique
  const stream = (canvas as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }).captureStream(1);
  return stream.getVideoTracks()[0];
}

export function PraticienneSenderClient({
  sessionId,
  roomId,
  isEnded,
  expiresAt,
}: {
  sessionId: string;
  roomId: string;
  isEnded: boolean;
  expiresAt?: string;
}) {
  const [phase, setPhase] = useState<Phase>(isEnded ? "ended" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const [maskedSinceMs, setMaskedSinceMs] = useState<number | null>(null);
  const [maskedElapsed, setMaskedElapsed] = useState<string>("00:00");

  // Realtime : si l'autre côté (Owner) coupe la session, on bascule en ended
  // immédiatement. Évite la désynchro state (avant : Patrick coupait, Anne
  // restait en phase live tant qu'elle ne refresh pas la page).
  const remoteStatus = useSupportSessionStatus({
    sessionId,
    initialStatus: isEnded ? "ENDED" : "PENDING",
  });
  useEffect(() => {
    if ((remoteStatus === "ENDED" || remoteStatus === "EXPIRED") && phase !== "ended") {
      // Cleanup tracks/pc/signaling si on était live
      streamRef.current?.getTracks().forEach((t) => t.stop());
      maskTrackRef.current?.stop();
      maskTrackRef.current = null;
      pcRef.current?.close();
      sigRef.current?.close();
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      setPhase("ended");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStatus]);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sigRef = useRef<SignalingHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Pour le masquage : on swap le track côté peer SEULEMENT, le preview local
  // reste sur le stream original (la praticienne voit ce qu'elle tape).
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  const originalTrackRef = useRef<MediaStreamTrack | null>(null);
  const maskTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    const cap = detectShareCapability();
    if (!cap.supported) setUnsupported(cap.reason ?? "Partage non disponible");
  }, []);

  useEffect(() => {
    if (phase !== "masked" || !maskedSinceMs) return;
    const tick = () => {
      const s = Math.floor((Date.now() - maskedSinceMs) / 1000);
      const mm = String(Math.floor(s / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");
      setMaskedElapsed(`${mm}:${ss}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, maskedSinceMs]);

  useEffect(() => {
    return () => {
      try { pcRef.current?.close(); } catch { /* empty */ }
      try { sigRef.current?.close(); } catch { /* empty */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      maskTrackRef.current?.stop();
    };
  }, []);

  async function startSharing() {
    setError(null);
    setPhase("picking");
    let stream: MediaStream;
    try {
      // displaySurface non spécifié → picker libre (Onglet / Fenêtre / Écran).
      // Pour partager une URL visible à Patrick : choisis « Fenêtre Chrome »
      // (la barre URL sera dans le flux vidéo). Pour privacy max : « Onglet ».
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Picker annulé ou refusé : ${msg}`);
      setPhase("idle");
      return;
    }
    streamRef.current = stream;
    originalTrackRef.current = stream.getVideoTracks()[0];
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    setPhase("connecting");

    stream.getVideoTracks()[0].addEventListener("ended", () => {
      void stopSharing();
    });

    try {
      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => {
        const s = pc.addTrack(track, stream);
        if (track.kind === "video") videoSenderRef.current = s;
      });

      const signaling = await openSignaling(roomId, async (sig) => {
        if (sig.kind === "answer") {
          await pc.setRemoteDescription({ type: "answer", sdp: sig.sdp });
        } else if (sig.kind === "ice") {
          try {
            await pc.addIceCandidate(sig.candidate);
          } catch { /* empty */ }
        }
      });
      sigRef.current = signaling;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          void signaling.send({ kind: "ice", candidate: e.candidate.toJSON() });
        }
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "connected") setPhase("live");
        else if (st === "failed" || st === "disconnected") {
          setError(`Connexion P2P ${st}`);
          setPhase("error");
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await signaling.send({ kind: "offer", sdp: offer.sdp! });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Erreur peer : ${msg}`);
      setPhase("error");
    }
  }

  async function stopSharing() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    maskTrackRef.current?.stop();
    maskTrackRef.current = null;
    pcRef.current?.close();
    sigRef.current?.close();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setPhase("ended");
  }

  // Masquage v3 — replaceTrack pour que le PEER ne voie qu'un canvas noir.
  // Local preview reste sur le stream original → praticienne voit ce qu'elle
  // tape (password, 2FA, etc.) en sécurité.
  async function toggleMask() {
    const sender = videoSenderRef.current;
    if (!sender) return;

    if (phase === "live") {
      if (!maskTrackRef.current) {
        maskTrackRef.current = createBlackVideoTrack();
      }
      await sender.replaceTrack(maskTrackRef.current);
      const startedAt = Date.now();
      setMaskedSinceMs(startedAt);
      setPhase("masked");
      void logMaskStart({ sessionId });
    } else if (phase === "masked") {
      const original = originalTrackRef.current;
      if (original) await sender.replaceTrack(original);
      const durationS = maskedSinceMs ? Math.floor((Date.now() - maskedSinceMs) / 1000) : 0;
      setMaskedSinceMs(null);
      setPhase("live");
      void logMaskEnd({ sessionId, durationSeconds: durationS });
    }
  }

  // Phase ENDED
  if (phase === "ended") {
    return (
      <section className="rounded-xl border-2 border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
        Partage terminé. Aucun enregistrement conservé.
      </section>
    );
  }

  // Phase UNSUPPORTED (iOS, Firefox Android, etc.)
  if (unsupported) {
    return (
      <section className="space-y-3 rounded-xl border-2 border-rose-300 bg-rose-50 p-5">
        <h3 className="text-base font-bold text-rose-900">
          📵 Partage non disponible sur ce device
        </h3>
        <p className="text-sm leading-relaxed text-rose-900">{unsupported}</p>
        <details className="rounded-lg bg-white/60 p-3 text-xs text-rose-900">
          <summary className="cursor-pointer font-bold">
            Pourquoi ? + Solutions
          </summary>
          <div className="mt-2 space-y-2 leading-relaxed">
            <p>
              Apple ne supporte pas <code>navigator.mediaDevices.getDisplayMedia()</code> sur
              iOS / iPadOS. Tous les browsers iOS utilisent WebKit Apple.
            </p>
            <p className="font-bold">Solutions :</p>
            <ul className="ml-5 list-disc space-y-1">
              <li>🥇 Bascule sur un Mac ou PC (Chrome / Edge / Firefox)</li>
              <li>Screenshot ponctuel via WhatsApp pour debug rapide</li>
              <li>AirPlay vers Mac proche</li>
            </ul>
          </div>
        </details>
      </section>
    );
  }

  // Banner sticky top — toujours visible quand partage actif/masqué/connexion
  const showBanner = phase === "live" || phase === "masked" || phase === "connecting";

  return (
    <>
      {showBanner && (
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b-2 border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              {phase === "live" && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  🔴 Session active — Patrick voit votre onglet
                </span>
              )}
              {phase === "masked" && (
                <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
                  🙈 Écran masqué pour Patrick — {maskedElapsed}
                </span>
              )}
              {phase === "connecting" && (
                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-900">
                  ⏳ Connexion P2P en cours…
                </span>
              )}
            </div>

            <p className="hidden text-xs italic text-neutral-500 md:block">
              💡 Tu peux masquer pour taper un mot de passe ou arrêter à tout moment.
            </p>

            {(phase === "live" || phase === "masked") && (
              <button
                type="button"
                onClick={toggleMask}
                className={
                  "ml-auto rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm " +
                  (phase === "masked"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-500 hover:bg-amber-600")
                }
              >
                {phase === "masked" ? "👁 Reprendre" : "🙈 Masquer pour Patrick"}
              </button>
            )}

            <form
              action={endSupportSession}
              className={phase === "connecting" ? "ml-auto" : ""}
              onSubmit={() => {
                // Optimistic UI : on cleanup et passe à ended AVANT que
                // le server action revalide la page (sinon délai 1-3s visible).
                streamRef.current?.getTracks().forEach((t) => t.stop());
                maskTrackRef.current?.stop();
                maskTrackRef.current = null;
                pcRef.current?.close();
                sigRef.current?.close();
                if (localVideoRef.current) localVideoRef.current.srcObject = null;
                setPhase("ended");
              }}
            >
              <input type="hidden" name="session_id" value={sessionId} />
              <input type="hidden" name="ended_by" value="PRATICIENNE" />
              <button
                type="submit"
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                title="Arrêter le partage et fermer la session"
              >
                ⛔ Arrêter la session
              </button>
            </form>
          </div>
          {expiresAt && (
            <p className="mx-auto mt-1 max-w-3xl text-[10px] text-neutral-500">
              Session expire automatiquement à {new Date(expiresAt).toLocaleTimeString("fr-CH")}
            </p>
          )}
        </div>
      )}

      <section className="space-y-4 rounded-xl border-2 border-neutral-200 bg-white p-5">
        <header className="flex flex-wrap items-baseline gap-3">
          <h3 className="text-base font-bold text-blue-950">🖥️ Partage d&apos;onglet</h3>
        </header>

        {phase === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-700">
              Click ci-dessous pour choisir ce que tu partages. Le picker
              proposera 3 options :
            </p>
            <ul className="ml-5 list-disc text-xs text-neutral-700 space-y-0.5">
              <li>
                <strong>Onglet</strong> — privacy max, mais Patrick ne verra
                pas la barre URL
              </li>
              <li>
                <strong>Fenêtre Chrome</strong> — Patrick voit ta barre URL
                (utile pour PF Sandbox, sites avec navigation), mais aussi tes
                autres onglets si tu switches
              </li>
              <li>
                <strong>Écran entier</strong> — tout ce qui est sur ton écran
                (à éviter sauf cas exceptionnel)
              </li>
            </ul>
            <button
              type="button"
              onClick={startSharing}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
            >
              📤 Partager mon écran
            </button>
          </div>
        )}

        {(phase === "live" || phase === "masked" || phase === "connecting") && (
          <>
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="block max-h-96 w-full object-contain"
              />
            </div>
            <p className="text-[11px] italic text-neutral-500">
              Aperçu local — c&apos;est ce que toi tu vois.{" "}
              {phase === "masked" ? (
                <strong className="text-amber-700">
                  Patrick voit un écran noir (canvas) pendant le masquage.
                </strong>
              ) : (
                "Patrick voit la même chose en P2P (latence cible < 500 ms)."
              )}
            </p>
          </>
        )}

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
            {error}
          </div>
        )}
      </section>
    </>
  );
}
