"use client";

// Liste des compteurs Backlog Cercle SR — une ligne par entité tracée
// (Esprits désincarnés, Entité Champignons, …). Pattern GL :
//   [emoji label] [−] [pastille count cliquable] [+]
// Click sur la pastille → input saisie absolue (Enter sauve, Esc annule).
// DEC Patrick 2026-05-29.

import { useState } from "react";
import { bumpBacklogCounter, setBacklogCounterAbsolute } from "./backlog-counter-action";

export type BacklogCounter = {
  id: string;
  name: string;
  emoji: string | null;
  count: number;
  updated_at: string;
};

export function BacklogCountersList({
  counters,
  canWrite,
}: {
  counters: BacklogCounter[];
  canWrite: boolean;
}) {
  if (counters.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {counters.map((c) => (
        <li key={c.id}>
          <CounterRow counter={c} canWrite={canWrite} />
        </li>
      ))}
    </ul>
  );
}

function CounterRow({ counter, canWrite }: { counter: BacklogCounter; canWrite: boolean }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-white px-2 py-1">
      <span className="flex-1 text-[12px] font-semibold text-amber-900">
        {counter.emoji ? <span className="mr-1">{counter.emoji}</span> : null}
        {counter.name}
      </span>
      {canWrite ? (
        <form action={bumpBacklogCounter}>
          <input type="hidden" name="id" value={counter.id} />
          <input type="hidden" name="delta" value="-1" />
          <button
            type="submit"
            disabled={counter.count === 0}
            className="flex h-5 w-5 items-center justify-center rounded border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-30"
            title="−1"
          >
            −
          </button>
        </form>
      ) : null}
      {canWrite && editing ? (
        <form
          action={setBacklogCounterAbsolute}
          onSubmit={() => setEditing(false)}
        >
          <input type="hidden" name="id" value={counter.id} />
          <input type="hidden" name="expected_updated_at" value={counter.updated_at} />
          <input
            type="number"
            name="value"
            defaultValue={counter.count}
            min={0}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
            className="w-16 rounded-full bg-amber-50 px-2 py-0.5 text-center font-mono text-[11px] font-bold text-amber-900 ring-1 ring-amber-400 focus:outline-none focus:ring-2"
          />
          <button type="submit" className="sr-only" tabIndex={-1}>
            Sauver
          </button>
        </form>
      ) : canWrite ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900 transition hover:ring-2 hover:ring-amber-300"
          title="Cliquer pour saisir un nombre exact"
        >
          {counter.count}
        </button>
      ) : (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900">
          {counter.count}
        </span>
      )}
      {canWrite ? (
        <form action={bumpBacklogCounter}>
          <input type="hidden" name="id" value={counter.id} />
          <input type="hidden" name="delta" value="1" />
          <button
            type="submit"
            className="flex h-5 w-5 items-center justify-center rounded border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50"
            title="+1"
          >
            +
          </button>
        </form>
      ) : null}
    </div>
  );
}
