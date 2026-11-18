"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copiar",
  successLabel = "Copiado!",
  className = "",
}: {
  text: string;
  label?: string;
  successLabel?: string;
  className?: string;
}) {
  const [ok, setOk] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch {
      setOk(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`rounded px-2 py-1 text-xs transition ${
        ok
          ? "bg-emerald-800 text-emerald-100"
          : "bg-slate-800 text-cyan-100 ring-1 ring-cyan-500/25 hover:bg-slate-700"
      } ${className}`}
    >
      {ok ? successLabel : label}
    </button>
  );
}
