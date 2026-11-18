"use client";

import { useState } from "react";

const RARITY_BG: Record<string, string> = {
  Junk: "bg-[#3a3a3a]",
  Basic: "bg-[#8a8a8a]",
  Fine: "bg-[#1a5a9a]",
  Masterwork: "bg-[#1a7a3a]",
  Rare: "bg-[#9a7a1a]",
  Exotic: "bg-[#9a5a1a]",
  Ascended: "bg-[#9a2a4a]",
  Legendary: "bg-[#5a2a8a]",
};

/** Ícone do jogo (CDN ArenaNet). Sem next/image para URLs dinâmicas. */
export function ItemIcon({
  src,
  alt = "",
  size = 28,
  className = "",
  rarity,
  showPlaceholder = false,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  rarity?: string | null;
  /** Se false (default), sem src não renderiza o bloco cinza. */
  showPlaceholder?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const box = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    maxWidth: size,
    maxHeight: size,
  } as const;

  const plate =
    RARITY_BG[rarity ?? ""] ?? "bg-[#1a2436] ring-1 ring-cyan-500/20";

  if (!src || failed) {
    if (!showPlaceholder) return null;
    return (
      <span
        className={`inline-block shrink-0 self-start rounded ${plate} ${className}`}
        style={box}
        title="Sem ícone"
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 self-start items-center justify-center overflow-hidden rounded ${plate} ${className}`}
      style={box}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain p-0.5"
        style={{ width: size, height: size }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
