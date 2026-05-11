export const dynamic = "force-static";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">
            Accès non autorisé
          </h1>
          <p className="text-sm text-neutral-600">
            SVLBH Pro est disponible pour les praticiennes certifiées ST4.
          </p>
          <p className="pt-2 text-sm text-neutral-500">
            Pour les niveaux ST1 à ST2, l&apos;App SVLBH-Priv 1 est disponible
            pour vos formations.
          </p>
        </div>
        <a
          href="https://priv.svlbh.com"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ouvrir SVLBH Priv-1 →
        </a>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
