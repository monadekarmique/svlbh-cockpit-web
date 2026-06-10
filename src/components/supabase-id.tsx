// Inspecteur d'IDs Supabase (ST6) — affiche l'id d'un objet en monospace,
// caché par défaut, révélé quand le toggle header active body[data-show-ids].
// Voir id-inspector.tsx (toggle) + globals.css (.svid).

export function SupabaseId({
  id,
  label,
}: {
  id?: string | number | null;
  label?: string;
}) {
  if (id === null || id === undefined || id === "") return null;
  const value = String(id);
  return (
    <span className="svid" title={`Supabase id${label ? ` · ${label}` : ""} : ${value}`}>
      {label ? `${label}:` : ""}
      {value}
    </span>
  );
}
