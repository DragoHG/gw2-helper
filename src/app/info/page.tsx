import { HelperChrome } from "@/components/HelperChrome";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGES: Array<{ href: string; name: string; blurb: string }> = [
  {
    href: "/",
    name: "Fazer agora",
    blurb: "Recorte do dia: sessão, eventos, Vault, Ascended, mastery, história e PvP/WvW.",
  },
  {
    href: "/roadmap",
    name: "Linha do tempo",
    blurb: "Plano completo da conta em faixas (agora → poder → mastery → história → craft → competitivo).",
  },
  {
    href: "/events",
    name: "Eventos",
    blurb: "Timeline de world bosses/metas alinhada ao que falta no seu progresso.",
  },
  {
    href: "/achievements",
    name: "Achievements",
    blurb: "Os mais fáceis agora, com teleport e wiki (LW só se já tocada).",
  },
  {
    href: "/ascended",
    name: "Ascended",
    blurb: "Upgrade de slots do personagem focado (Laurel / Fractals / craft / TP).",
  },
  {
    href: "/masteries",
    name: "Masteries",
    blurb: "Próximo nível fácil + guia de XP por região.",
  },
  {
    href: "/craft",
    name: "Crafting",
    blurb: "Receitas unlocked × estoque × preço TP e farm do faltante.",
  },
  {
    href: "/materials",
    name: "Materiais",
    blurb: "Storage classificada: guardar / craft / TP / lixo.",
  },
  {
    href: "/economy",
    name: "Economia",
    blurb: "Carteira, delivery do TP e mats com valor contextualizado.",
  },
  {
    href: "/pvp",
    name: "PvP / WvW",
    blurb: "sPvP equalizado + World vs World (rank, matchup, badges).",
  },
  {
    href: "/vault",
    name: "Vault",
    blurb: "Wizard's Vault diário/semanal com guia de como cumprir.",
  },
  {
    href: "/legendaries",
    name: "Lendários",
    blurb: "Próximos passos de collections lendárias no estágio certo.",
  },
];

export default function InfoPage() {
  return (
    <div className="space-y-8">
      <HelperChrome
        title="Sobre o GW2 Helper"
        subtitle="Helper local no browser: lê a API oficial da sua conta e o catálogo público do jogo para dizer o que fazer agora - com wiki e teleport."
      />

      <section className="panel space-y-3 p-4 break-safe">
        <h3 className="font-display text-xl text-cyan-50">O que faz</h3>
        <p className="text-sm text-slate-300">
          Consolida progresso PvE e competitivo (sPvP/WvW), Ascended, masteries,
          crafting, eventos, Vault, história por expansão e recomendações
          adaptadas ao estágio (F2P → Visions of Eternity). Não inventa
          progresso: tudo vem da API ArenaNet + índices locais.
        </p>
      </section>

      <section className="panel space-y-3 p-4 break-safe">
        <h3 className="font-display text-xl text-cyan-50">O que consulta</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li>
            <strong>Conta:</strong>{" "}
            <code className="text-cyan-200">api.guildwars2.com</code> com a sua
            API key (personagens, inventário, achievements, PvP, wallet…).
          </li>
          <li>
            <strong>Jogo (público):</strong> mapas, waypoints, masteries, ranks
            WvW, schedule de eventos (wiki), beats de história.
          </li>
        </ul>
      </section>

      <section className="panel space-y-3 p-4 break-safe">
        <h3 className="font-display text-xl text-cyan-50">Duas camadas</h3>
        <p className="text-sm text-slate-300">
          <strong>Atualizar dados do jogo</strong> - catálogo público (mapas,
          eventos, masteries, WvW ranks, história…). Não muda seu progresso.
        </p>
        <p className="text-sm text-slate-300">
          <strong>Atualizar minha conta</strong> - sincroniza a API key e
          recalcula recomendações / roadmap.
        </p>
      </section>

      <section className="panel space-y-3 p-4 break-safe">
        <h3 className="font-display text-xl text-cyan-50">
          Como pegar a API key (oficial)
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
          <li>
            Abra{" "}
            <a
              href="https://account.arena.net/applications"
              target="_blank"
              rel="noreferrer"
              className="neon-link hover:underline"
            >
              account.arena.net/applications
            </a>
          </li>
          <li>Crie uma key com scopes: account, characters, inventories, builds, progression, unlocks, wallet, pvp, tradingpost</li>
          <li>
            Cole no arquivo local <code className="text-cyan-200">.env.local</code>{" "}
            como <code className="text-cyan-200">GW2_API_KEY=…</code>
          </li>
          <li>Clique em Atualizar minha conta</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-xl text-cyan-100">Páginas</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="panel block p-4 transition hover:border-cyan-400/40"
            >
              <p className="text-cyan-50">{p.name}</p>
              <p className="mt-1 text-sm text-slate-400">{p.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel-glow space-y-4 p-5 break-safe">
        <h3 className="font-display text-xl text-cyan-50">Autor</h3>
        <p className="text-lg text-cyan-50">Fabio Monreal</p>
        <p className="text-sm text-slate-300">
          <a
            href="mailto:fabio.monreal@outlook.com"
            className="neon-link hover:underline"
          >
            fabio.monreal@outlook.com
          </a>
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="https://github.com/DragoHG"
            target="_blank"
            rel="noreferrer"
            className="neon-link hover:underline"
          >
            GitHub
          </a>
          <a
            href="https://fabio-monreal.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="neon-link hover:underline"
          >
            Portfólio
          </a>
          <a
            href="https://vibranceflow.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="neon-link hover:underline"
          >
            VibranceFlow
          </a>
        </div>
        <a
          href="https://ko-fi.com/fabio_monreal"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#ff5e5b] px-4 py-2 text-sm font-medium text-white shadow hover:brightness-110"
        >
          <KofiIcon />
          Buy me a coffee
        </a>
      </section>
    </div>
  );
}

function KofiIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.722c-.316 0-.438.246-.438.492v8.618c0 2.834 2.458 5.166 5.515 5.166h3.4c3.057 0 5.515-2.332 5.515-5.166V9.44s3.992-.253 4.859-4.492zm-5.656.62H6.515v6.5c0 1.59-1.298 2.888-2.888 2.888h-1.2c-1.59 0-2.888-1.298-2.888-2.888v-6.5h19.586c-.35 1.85-1.55 2.888-3.1 2.888z" />
      <path d="M12.5 10.5c-2.2 0-3.5 1.6-3.5 3.3 0 2.3 3.5 5.2 3.5 5.2s3.5-2.9 3.5-5.2c0-1.7-1.3-3.3-3.5-3.3z" fill="#fff" opacity=".9" />
    </svg>
  );
}
