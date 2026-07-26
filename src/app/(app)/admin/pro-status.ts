// Source unique des valeurs de l'enum Postgres pro_status (revue 26.07).
// Module SANS "use server" : un fichier d'actions ne peut exporter que des
// fonctions async — c'est ici que vivent les constantes partagées page/actions.
export const PRO_STATUSES = ["ACTIVE", "SUSPENDED", "REVOKED", "MIGRATED"] as const;
export type ProStatus = (typeof PRO_STATUSES)[number];

export const PRO_STATUS_LABEL: Record<ProStatus, string> = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED · inactive",
  REVOKED: "REVOKED",
  MIGRATED: "MIGRATED",
};
