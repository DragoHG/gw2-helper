"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CharacterPicker({
  characters,
  selected,
}: {
  characters: Array<{
    name: string;
    profession: string;
    level: number;
    isMain: boolean;
  }>;
  selected: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onChange(name: string) {
    setError(null);
    try {
      const res = await fetch("/api/prefs/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao selecionar");
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  if (!characters.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="text-slate-400" htmlFor="char-picker">
        Personagem
      </label>
      <select
        id="char-picker"
        className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-amber-50"
        value={selected ?? ""}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
      >
        {characters.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name} - {c.profession} {c.level}
            {c.isMain ? " (main)" : ""}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-slate-500">atualizando...</span>}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
