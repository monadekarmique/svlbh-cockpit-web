// PostFinance Checkout — read transaction par ID.
// Doc : /api/transaction/read?spaceId=X&id=Y → détails complets.
// DEC Patrick 2026-05-21 (Option B endpoint direct, webhook reçoit juste un
// entityId + spaceId, on doit fetcher les détails).

import { pfFetch, type PfCredentials } from "./api-client";

export type PfTransactionState =
  | "CREATE" | "PENDING" | "CONFIRMED" | "AUTHORIZED" | "DECLINE"
  | "FAILED" | "FULFILL" | "PROCESSING" | "VOIDED" | "COMPLETED" | "DONE";

export type PfTransaction = {
  id: number;
  state: PfTransactionState;
  authorizedAmount?: number;
  completedAmount?: number;
  currency: string;
  merchantReference?: string | null;
  orderReference?: string | null;
  metaData?: Record<string, string> | null;
  createdOn?: string;
  customerId?: string | null;
  customerEmailAddress?: string | null;
  billingAddress?: {
    givenName?: string | null;
    familyName?: string | null;
    emailAddress?: string | null;
  } | null;
  spaceId: number;
};

export async function readTransaction({
  credentials,
  spaceId,
  transactionId,
}: {
  credentials: PfCredentials;
  spaceId: string | number;
  transactionId: string | number;
}): Promise<PfTransaction> {
  return pfFetch<PfTransaction>({
    method: "GET",
    path: `/api/transaction/read?spaceId=${spaceId}&id=${transactionId}`,
    credentials,
  });
}
