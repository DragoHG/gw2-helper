"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Refresh completo do DB público do jogo (não usa progresso da conta). */
export function CatalogRefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRefresh() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/catalog/refresh?force=1", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível atualizar os dados do jogo");
      }
      setMessage(
        [
          "Dados do jogo atualizados",
          `${data.waypointCount ?? 0} WP`,
          `${data.eventCount ?? 0} eventos`,
          `${data.masteryCount ?? 0} masteries`,
          `${data.wvwRankCount ?? 0} ranks WvW`,
          `${data.storyBeatCount ?? 0} história`,
          `${data.mapCount ?? 0} mapas`,
        ].join(" · "),
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha ao atualizar o catálogo. Tente de novo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded border border-cyan-500/30 bg-slate-900/80 px-3 py-2 text-sm text-cyan-100 transition hover:border-cyan-400/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        title="Atualiza waypoints, eventos, masteries, ranks WvW, história e índices públicos (não muda seu progresso)"
      >
        {loading ? "Atualizando dados do jogo..." : "Atualizar dados do jogo"}
      </button>
      {message && <p className="text-xs text-emerald-400 break-safe">{message}</p>}
      {error && <p className="text-xs text-red-400 break-safe">{error}</p>}
    </div>
  );
}
