"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSync() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível atualizar a conta");
      }
      setMessage(
        `Conta atualizada · ${data.characters?.length ?? 0} personagem(ns) · ${data.recommendations?.total ?? 0} dicas novas`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Algo deu errado. Confira sua chave do jogo e tente de novo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className="rounded bg-cyan-600/90 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(60,240,200,0.25)] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Atualizando conta..." : "Atualizar minha conta"}
      </button>
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
