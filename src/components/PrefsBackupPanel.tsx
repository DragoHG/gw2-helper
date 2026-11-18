"use client";

import { useState } from "react";

export function PrefsBackupPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function downloadBackup() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/prefs/backup");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha no export");
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gw2-helper-prefs.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Backup baixado (personagem em foco e achievements fixados).");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erro no export");
    } finally {
      setBusy(false);
    }
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const body = JSON.parse(text);
      const res = await fetch("/api/prefs/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha no import");
      setStatus(
        `Import ok · ${json.backup?.pinned_achievement_ids?.length ?? 0} pins.`,
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erro no import");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-amber-100">Salvar / restaurar preferências</h3>
      <p className="mt-1 text-xs text-slate-500">
        Guarda o personagem em foco e os achievements que você fixou. Não inclui
        a chave do jogo nem o inventário.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void downloadBackup()}
          className="rounded border border-amber-800/60 bg-amber-950/40 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-900/50 disabled:opacity-50"
        >
          Baixar JSON
        </button>
        <label className="cursor-pointer rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            disabled={busy}
            onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {status && <p className="mt-2 text-sm text-slate-300">{status}</p>}
    </section>
  );
}
