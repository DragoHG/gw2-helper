import { HelperChrome } from "@/components/HelperChrome";
import { loadLatestSnapshot } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import Link from "next/link";

export const dynamic = "force-dynamic";

function normalizeCrafting(raw: unknown): Array<{
  discipline: string;
  rating: number;
  active: boolean;
}> {
  if (Array.isArray(raw)) return raw;
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as { crafting?: unknown }).crafting)
  ) {
    return (
      raw as {
        crafting: Array<{
          discipline: string;
          rating: number;
          active: boolean;
        }>;
      }
    ).crafting;
  }
  return [];
}

export default function CharactersPage() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot) {
    return (
      <HelperChrome
        title="Personagens"
        subtitle="Atualize a conta para listar personagens, nível e crafting."
      />
    );
  }

  const focused = getFocusedCharacter(snapshot);
  const chars = [...snapshot.characters].sort(
    (a, b) => b.core.level - a.core.level || b.core.age - a.core.age,
  );

  return (
    <div className="space-y-4">
      <HelperChrome
        title="Personagens"
        subtitle="O personagem em foco (topo da página) é o usado em Equipamento e Ascended. Escolha outro se quiser planejar um alt."
      />
      <p className="text-sm">
        <Link href="/gear" className="text-amber-400 hover:underline">
          Ver equipamento →
        </Link>{" "}
        <Link href="/ascended" className="ml-3 text-amber-400 hover:underline">
          Plano Ascended →
        </Link>
      </p>
      {chars.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum personagem listado. Confira a chave do jogo e atualize a conta.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Profissão</th>
                <th className="px-3 py-2">Raça</th>
                <th className="px-3 py-2">Nível</th>
                <th className="px-3 py-2">Idade (h)</th>
                <th className="px-3 py-2">Mortes</th>
                <th className="px-3 py-2">Crafting</th>
              </tr>
            </thead>
            <tbody>
              {chars.map((c) => {
                const crafting = normalizeCrafting(c.crafting);
                const isFocus = c.core.name === focused?.core.name;
                return (
                  <tr
                    key={c.core.name}
                    className={`border-t border-slate-800 ${
                      isFocus ? "bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-amber-50">
                      {c.core.name}
                      {isFocus ? (
                        <span className="ml-2 text-xs text-amber-400">foco</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{c.core.profession}</td>
                    <td className="px-3 py-2">{c.core.race}</td>
                    <td className="px-3 py-2">{c.core.level}</td>
                    <td className="px-3 py-2">
                      {formatNumber(Math.round(c.core.age / 3600))}
                    </td>
                    <td className="px-3 py-2">{c.core.deaths}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {crafting.length
                        ? crafting
                            .map((d) => `${d.discipline} ${d.rating}`)
                            .join(" · ")
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
