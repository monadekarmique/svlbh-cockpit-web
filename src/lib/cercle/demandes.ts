// Demandes — fetch live invoices + sessions via vlbh-energy-mcp.
// Port DemandesService.swift.

const BASE_URL = "https://vlbh-energy-mcp.onrender.com";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
  cancelled: "Annulée",
};

export const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: "#999999",
  sent: "#BA7517",
  paid: "#1D9E75",
  overdue: "#E24B4A",
  cancelled: "#666666",
};

export type Invoice = {
  id: string;
  invoice_number: string;
  patient_id: string;
  practitioner_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string | null;
};

async function fetchWithToken(
  url: string,
  token: string,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    return await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchInvoices(
  patientId: string,
  token: string,
): Promise<{ ok: true; invoices: Invoice[] } | { ok: false; error: string }> {
  try {
    const res = await fetchWithToken(
      `${BASE_URL}/invoices?patient_id=${encodeURIComponent(patientId)}`,
      token,
    );
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = (await res.json()) as { invoices?: Invoice[] };
    return { ok: true, invoices: data.invoices ?? [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
