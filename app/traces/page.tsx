"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ApiTrace {
  trace_id: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  user_email: string | null;
  error_message: string | null;
}

export default function TracesPage() {
  const [traces, setTraces] = useState<ApiTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "errors" | "slow">("all");

  useEffect(() => {
    loadTraces();
    const interval = setInterval(loadTraces, 20000); // Refresh every 20s
    return () => clearInterval(interval);
  }, [filter]);

  async function loadTraces() {
    const supabase = createClient();
    let query = supabase
      .from("api_trace")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (filter === "errors") {
      query = query.gte("status_code", 400);
    } else if (filter === "slow") {
      query = query.gte("duration_ms", 1000);
    }

    const { data } = await query;
    setTraces(data || []);
    setLoading(false);
  }

  const statusColor = (code: number) => {
    if (code >= 500) return "bg-red-100 text-red-800";
    if (code >= 400) return "bg-orange-100 text-orange-800";
    if (code >= 300) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const durationColor = (ms: number) => {
    if (ms >= 2000) return "text-red-600 font-bold";
    if (ms >= 1000) return "text-orange-600";
    if (ms >= 500) return "text-yellow-600";
    return "text-gray-500";
  };

  // Stats
  const errorCount = traces.filter((t) => t.status_code >= 400).length;
  const slowCount = traces.filter((t) => t.duration_ms >= 1000).length;
  const avgDuration =
    traces.length > 0
      ? Math.round(traces.reduce((a, t) => a + t.duration_ms, 0) / traces.length)
      : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Traces</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total (100 dernières)</div>
          <div className="text-2xl font-bold">{traces.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Erreurs (4xx/5xx)</div>
          <div className="text-2xl font-bold text-red-600">{errorCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Lentes (&gt;1s)</div>
          <div className="text-2xl font-bold text-orange-600">{slowCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Durée moyenne</div>
          <div className="text-2xl font-bold">{avgDuration}ms</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "errors", "slow"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm ${
              filter === f
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Toutes" : f === "errors" ? "Erreurs" : "Lentes"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Chargement...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Method</th>
                <th className="px-4 py-2 text-left">Path</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {traces.map((t) => (
                <tr key={t.trace_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                    {new Date(t.timestamp).toLocaleString("fr-CH")}
                  </td>
                  <td className="px-4 py-2 font-mono">{t.method}</td>
                  <td className="px-4 py-2 font-mono text-xs max-w-xs truncate">
                    {t.path}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(
                        t.status_code
                      )}`}
                    >
                      {t.status_code}
                    </span>
                  </td>
                  <td className={`px-4 py-2 font-mono ${durationColor(t.duration_ms)}`}>
                    {t.duration_ms}ms
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
                    {t.user_email || "—"}
                  </td>
                  <td className="px-4 py-2 text-xs text-red-600 max-w-xs truncate">
                    {t.error_message || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
