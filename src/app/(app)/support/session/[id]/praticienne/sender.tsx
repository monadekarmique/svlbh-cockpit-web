"use client";

// SenderClient — côté praticienne. getDisplayMedia tab-only, RTCPeerConnection,
// signaling via Supabase Realtime. Inclut bouton masquage v3 (track.enabled).
// DEC Patrick 2026-05-21 (brief v3 Phase 3 + Addendum v3 masquage).

import { useEffect, useRef, useState } from "react";
import {
  openSignaling,
  createPeerConnection,
  type SignalingHandle,
} from "@/lib/support/webrtc-signaling";
import { logMaskStart, logMaskEnd } from "../../../mask-actions";

type Phase = "idle" | "picking" | "connecting" | "live" | "masked" | "ended" | "error";

export function PraticienneSenderClient({
  sessionId,
  roomId,
  isEnded,
}: {
  sessionId: string;
  roomId: string;
  isEnded: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(isEnded ? "ended" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [maskedSinceMs, setMaskedSinceMs] = useState<number | null>(null);
  const [maskedElapsed, setMaskedElapsed] = useState<string>("00:00");
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sigRef = useRef<SignalingHandle | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Compteur de durée du masquage
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

  // Cleanup
  useEffect(() => {
    return () => {
      try { pcRef.current?.close(); } catch { /* empty */ }
      try { sigRef.current?.close(); } catch { /* empty */ }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startSharing() {
    setError(null);
    setPhase("picking");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        // Hint browser pour ouvrir le picker en mode Onglet (Chrome/Edge/Firefox).
        // Safari ignore mais demande tout de même la confirmation utilisateur.
        video: {
          displaySurface: "browser",
        } as MediaTrackConstraints,
        audio: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Picker annulé ou refusé : ${msg}`);
      setPhase("idle");
      return;
    }
    streamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    setPhase("connecting");

    // Si l'utilisatrice arrête le partage depuis le picker du browser, on coupe.
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      void stopSharing();
    });

    try {
      const pc = createPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

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
    pcRef.current?.close();
    sigRef.current?.close();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setPhase("ended");
  }

  // Masquage v3 — videoTrack.enabled = false → trames noires immédiates,
  // session reste ouverte. Idéalement <500 ms côté Patrick (juste un flip de flag).
  async function toggleMask() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    if (phase === "live") {
      track.enabled = false;
      const startedAt = Date.now();
      setMaskedSinceMs(startedAt);
      setPhase("masked");
      void logMaskStart({ sessionId });
    } else if (phase === "masked") {
      track.enabled = true;
      const durationS = maskedSinceMs ? Math.floor((Date.now() - maskedSinceMs) / 1000) : 0;
      setMaskedSinceMs(null);
      setPhase("live");
      void logMaskEnd({ sessionId, durationSeconds: durationS });
    }
  }

  if (phase === "ended") {
    return (
      <section className="rounded-xl border-2 border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
        Partage terminé.
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border-2 border-neutral-200 bg-white p-5">
      <header className="flex flex-wrap items-baseline gap-3">
        <h3 className="text-base font-bold text-blue-950">🖥️ Partage d&apos;onglet</h3>
        {phase === "live" && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            🟢 LIVE
          </span>
        )}
        {phase === "masked" && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            🙈 MASQUÉ {maskedElapsed}
          </span>
        )}
        {phase === "connecting" && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900">
            ⏳ Connexion P2P…
          </span>
        )}
      </header>

      {phase === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">
            Click ci-dessous pour choisir <strong>l&apos;onglet</strong> à
            partager. Chrome/Edge/Firefox ouvriront le picker en mode
            « Onglet » par défaut.
          </p>
          <button
            type="button"
            onClick={startSharing}
            className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
          >
            📤 Partager mon onglet
          </button>
        </div>
      )}

      {(phase === "live" || phase === "masked" || phase === "connecting") && (
        <>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-black">
            {phase === "masked" ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 bg-neutral-900 text-white">
                <p className="text-5xl">🙈</p>
                <p className="text-sm font-bold">Partage masqué — {maskedElapsed}</p>
                <p className="text-xs text-neutral-400">
                  Patrick voit un écran noir. Tape ton mot de passe / 2FA en sécurité.
                </p>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="block max-h-96 w-full object-contain"
              />
            )}
          </div>
          <p className="text-[10px] italic text-neutral-500">
            Aperçu local — Patrick voit la même chose en P2P (latence cible &lt; 500 ms).
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleMask}
              disabled={phase === "connecting"}
              className={
                phase === "masked"
                  ? "rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
                  : "rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:bg-neutral-400"
              }
            >
              {phase === "masked" ? "👁 Reprendre le partage" : "🙈 Masquer mon écran temporairement"}
            </button>
            <button
              type="button"
              onClick={stopSharing}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
            >
              ⛔ Arrêter le partage
            </button>
            {phase !== "masked" && (
              <p className="text-[11px] italic text-neutral-500">
                💡 Tu peux masquer ton écran si tu dois entrer un mot de passe.
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          {error}
        </div>
      )}
    </section>
  );
}
