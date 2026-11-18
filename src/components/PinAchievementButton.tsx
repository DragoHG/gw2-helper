"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PinAchievementButton({
  id,
  pinned,
}: {
  id: number;
  pinned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isPinned, setIsPinned] = useState(pinned);

  async function toggle() {
    const res = await fetch("/api/prefs/pin-achievement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      setIsPinned(Boolean(data.pinned));
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className={`rounded px-2 py-1 text-xs ${
        isPinned
          ? "bg-amber-800/70 text-amber-50"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {isPinned ? "Fixado" : "Fixar"}
    </button>
  );
}
