import { ActionHints } from "@/components/ActionHints";
import { HelperChrome } from "@/components/HelperChrome";
import { ItemIcon } from "@/components/ItemIcon";
import { loadLatestSnapshot } from "@/lib/db";
import { findNearestWaypoint } from "@/lib/geo/waypoints";
import { wikiSearch } from "@/lib/wiki";
import { getFocusedCharacter } from "@/lib/gw2/focus";
import { analyzeCharacterSlots } from "@/lib/gw2/gear";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function GearPage() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) {
    return (
      <HelperChrome
        title="Equipamento"
        subtitle="Atualize a conta para ver o que cada personagem está vestindo e o que ainda precisa de upgrade para Ascended."
      />
    );
  }

  const focused = getFocusedCharacter(snapshot);
  const characters = [...snapshot.characters].sort(
    (a, b) => b.core.level - a.core.level,
  );
  const la = findNearestWaypoint(["Lion's Arch"]);

  return (
    <div className="space-y-6">
      <HelperChrome
        title="Equipamento (PvE)"
        subtitle="Exotic já funciona bem. Ascended é o próximo salto de poder no mapa aberto e fractals. No PvP este gear não conta - use a aba PvP."
      />
      <p className="flex flex-wrap gap-3 text-sm">
        <a
          href={wikiSearch("Equipment")}
          target="_blank"
          rel="noreferrer"
          className="text-amber-400 hover:underline"
        >
          Wiki - Equipment
        </a>
        <Link href="/ascended" className="text-amber-400 hover:underline">
          Plano Ascended →
        </Link>
        {la?.waypoint.chatLink && (
          <span className="text-slate-400">
            Hub: Lion&apos;s Arch (vendors, TP, craft)
          </span>
        )}
      </p>
      {la?.waypoint.chatLink && (
        <ActionHints
          how="Se um slot estiver fraco, abra o plano Ascended: Laurels para trinkets, Fractals para rings/back, craft ou Trading Post para o resto."
          where="Lion's Arch - Laurel Merchant, portal de Fractals e Trading Post."
          teleportLabel={`${la.waypoint.name} - ${la.waypoint.mapName}`}
          chatLink={la.waypoint.chatLink}
          wikiUrl={wikiSearch("Ascended equipment")}
          wikiLabel="Wiki - Ascended"
        />
      )}

      {characters.map((character) => {
        const slots = analyzeCharacterSlots(snapshot, character);
        const needs = slots.filter((s) => s.needsUpgrade).length;
        const isFocus = character.core.name === focused?.core.name;
        return (
          <section
            key={character.core.name}
            className={`rounded-lg border p-4 ${
              isFocus
                ? "border-amber-700/60 bg-amber-950/20"
                : "border-slate-700 bg-slate-900/40"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg text-amber-50">
                {character.core.name}{" "}
                <span className="text-sm text-slate-400">
                  {character.core.profession} · lvl {character.core.level}
                  {isFocus ? " · FOCO" : ""}
                </span>
              </h3>
              <p className="text-sm text-slate-300">
                {needs === 0
                  ? "Full Ascended+"
                  : `${needs} slot(s) abaixo de Ascended`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-2 py-1">Slot</th>
                    <th className="px-2 py-1">Item</th>
                    <th className="px-2 py-1">Raridade</th>
                    <th className="px-2 py-1">Upgrades</th>
                    <th className="px-2 py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot.slot} className="border-t border-slate-800">
                      <td className="px-2 py-1 text-slate-300">{slot.slot}</td>
                      <td className="px-2 py-1">
                        <span className="inline-flex items-center gap-2">
                          <ItemIcon src={slot.icon} alt="" size={24} />
                          {slot.name}
                        </span>
                      </td>
                      <td className="px-2 py-1">{slot.rarity}</td>
                      <td className="px-2 py-1">{slot.upgrades}</td>
                      <td className="px-2 py-1">
                        {slot.needsUpgrade ? (
                          <span className="text-amber-400">upgrade</span>
                        ) : (
                          <span className="text-emerald-400">ok</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
