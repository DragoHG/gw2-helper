"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: Array<{
  label: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    label: "Plano",
    links: [
      { href: "/", label: "Fazer agora" },
      { href: "/roadmap", label: "Linha do tempo" },
      { href: "/story", label: "História" },
      { href: "/events", label: "Eventos" },
      { href: "/daily", label: "Daily" },
      { href: "/vault", label: "Vault" },
    ],
  },
  {
    label: "Progresso",
    links: [
      { href: "/achievements", label: "Achievements" },
      { href: "/ascended", label: "Ascended" },
      { href: "/masteries", label: "Masteries" },
      { href: "/craft", label: "Crafting" },
      { href: "/materials", label: "Materiais" },
      { href: "/legendaries", label: "Lendários" },
    ],
  },
  {
    label: "Conta",
    links: [
      { href: "/account", label: "Conta" },
      { href: "/characters", label: "Personagens" },
      { href: "/gear", label: "Equipamento" },
      { href: "/economy", label: "Economia" },
      { href: "/pvp", label: "PvP / WvW" },
      { href: "/info", label: "Sobre" },
    ],
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-500/20 bg-[#070d18]/95 backdrop-blur-md">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Link href="/" className="group block">
            <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-400/80">
              GW2 Helper
            </p>
            <h1 className="font-display text-xl text-cyan-50 transition group-hover:text-white">
              Seu plano em Tyria
            </h1>
          </Link>
          <p className="max-w-xs text-right text-xs leading-relaxed text-slate-500">
            Copie o waypoint, cole no chat do jogo e clique no link.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-start gap-x-5 gap-y-3"
          aria-label="Principal"
        >
          {GROUPS.map((group, gi) => (
            <div
              key={group.label}
              className={`min-w-0 space-y-1.5 ${
                gi > 0
                  ? "border-l border-cyan-500/15 pl-5"
                  : ""
              }`}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.links.map((link) => {
                  const active =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname === link.href ||
                        pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-md px-2.5 py-1 text-sm transition ${
                        active
                          ? "bg-cyan-500/20 text-cyan-50 ring-1 ring-cyan-400/40"
                          : "text-slate-300 hover:bg-slate-800/70 hover:text-cyan-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
