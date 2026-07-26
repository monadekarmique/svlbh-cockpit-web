"use client";

// Error boundary /admin — sans lui, TOUTE erreur d'action serveur (validation,
// RLS, enum) remplaçait la page entière par l'écran d'erreur Next (incident
// « ERROR 3320491698 » du 26.07 sur Naïma/Flavia). Ici : le message, et on
// reste dans l'admin.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
          Admin · action refusée
        </p>
        <p className="mt-2 text-sm text-rose-900">
          {error.message || "Une erreur est survenue."}
        </p>
        {error.digest && (
          <p className="mt-1 text-[10px] text-rose-400">digest {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
        >
          Revenir à la liste
        </button>
      </div>
    </main>
  );
}
