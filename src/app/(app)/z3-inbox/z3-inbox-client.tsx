"use client";

// Inbox z3 — liste des conversations à gauche, fil + composer à droite.
// Rafraîchissement par polling (8 s) via server action.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchZ3Messages,
  markChatRead,
  sendZ3Message,
  type Z3Message,
} from "./actions";

function chatLabel(messages: Z3Message[]): string {
  for (const m of messages) {
    if (m.chat_name) return m.chat_name;
    if (m.sender_name && m.direction === "in") return m.sender_name;
  }
  return messages[0]?.chat_jid.split("@")[0] ?? "?";
}

export function Z3InboxClient({ initial }: { initial: Z3Message[] }) {
  const [messages, setMessages] = useState<Z3Message[]>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Polling 8 s
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const latest = messages[0]?.created_at;
        const fresh = await fetchZ3Messages(latest);
        if (fresh.length) {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            return [...fresh.filter((m) => !known.has(m.id)), ...prev];
          });
        }
      } catch {
        /* silencieux — prochaine itération */
      }
    }, 8000);
    return () => clearInterval(t);
  }, [messages]);

  const conversations = useMemo(() => {
    const byChat = new Map<string, Z3Message[]>();
    for (const m of messages) {
      const arr = byChat.get(m.chat_jid) ?? [];
      arr.push(m);
      byChat.set(m.chat_jid, arr);
    }
    return [...byChat.entries()]
      .map(([jid, msgs]) => ({
        jid,
        label: chatLabel(msgs),
        last: msgs[0],
        unread: msgs.filter((m) => m.direction === "in" && !m.read_at).length,
      }))
      .sort((a, b) => (b.last.created_at > a.last.created_at ? 1 : -1));
  }, [messages]);

  const selectedLabel = useMemo(() => {
    const c = conversations.find((c) => c.jid === selected);
    return c?.label ?? "";
  }, [conversations, selected]);

  const thread = useMemo(
    () =>
      messages
        .filter((m) => m.chat_jid === selected)
        .slice()
        .reverse(),
    [messages, selected],
  );

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [thread.length, selected]);

  async function ouvrir(jid: string) {
    setSelected(jid);
    setError(null);
    void markChatRead(jid);
    setMessages((prev) =>
      prev.map((m) =>
        m.chat_jid === jid && m.direction === "in" && !m.read_at
          ? { ...m, read_at: new Date().toISOString() }
          : m,
      ),
    );
  }

  async function envoyer() {
    if (!selected || !draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await sendZ3Message(selected, draft.trim());
    if (res.ok) {
      setMessages((prev) => [
        {
          id: `local-${prev.length}-${selected}`,
          wa_message_id: null,
          chat_jid: selected,
          chat_name: null,
          sender: null,
          sender_name: null,
          direction: "out" as const,
          content: draft.trim(),
          media_type: null,
          wa_timestamp: new Date().toISOString(),
          read_at: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setDraft("");
    } else {
      setError(res.error ?? "Échec d'envoi");
    }
    setBusy(false);
  }

  return (
    <div style={{ height: "calc(100vh - 180px)" }}>
      {/* Conversations — clic = la discussion s'ouvre dans une fenêtre */}
      <div className="max-w-xl h-full overflow-y-auto border rounded-lg bg-white">
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-gray-400">
            Aucun message pour l&apos;instant — la queue se remplit dès qu&apos;une
            certifiée écrit au +41 79 930 28 00.
          </p>
        )}
        {conversations.map((c) => (
          <button
            key={c.jid}
            onClick={() => ouvrir(c.jid)}
            className={`w-full text-left px-3 py-2 border-b hover:bg-amber-50 ${
              selected === c.jid ? "bg-amber-100" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm truncate">{c.label}</span>
              {c.unread > 0 && (
                <span className="ml-2 text-xs bg-green-600 text-white rounded-full px-2 py-0.5">
                  {c.unread}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {c.last.direction === "out" ? "↩︎ " : ""}
              {c.last.content || `[${c.last.media_type ?? "média"}]`}
            </p>
          </button>
        ))}
      </div>

      {/* Fenêtre de conversation (refermable à la fin de la discussion) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-[640px] max-w-[92vw] h-[78vh] flex flex-col border rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-semibold text-sm">💬 {selectedLabel}</p>
              <button
                onClick={() => setSelected(null)}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
              >
                Fermer ✕
              </button>
            </div>
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {thread.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[70%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.direction === "out"
                      ? "ml-auto bg-green-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {m.direction === "in" && m.sender_name && (
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                      {m.sender_name}
                    </p>
                  )}
                  {m.content || `[${m.media_type ?? "média"}]`}
                  <p className="text-[10px] opacity-60 mt-0.5">
                    {new Date(m.wa_timestamp ?? m.created_at).toLocaleString("fr-CH")}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t p-3 flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void envoyer();
                  }
                }}
                rows={2}
                placeholder="Répondre depuis le numéro z3…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <button
                onClick={() => void envoyer()}
                disabled={busy || !draft.trim()}
                className="px-4 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-40"
              >
                Envoyer
              </button>
            </div>
            {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
