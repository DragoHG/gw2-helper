import { CopyButton } from "@/components/CopyButton";

/** Bloco padrão: o quê fazer + teleport + wiki (copy para jogador). */
export function ActionHints({
  how,
  where,
  teleportLabel,
  chatLink,
  wikiUrl,
  wikiLabel = "Abrir na wiki",
}: {
  how?: string;
  where?: string;
  teleportLabel?: string;
  chatLink?: string;
  wikiUrl?: string;
  wikiLabel?: string;
}) {
  return (
    <div className="mt-2 min-w-0 space-y-1.5 break-safe text-sm">
      {how && (
        <p className="text-slate-300">
          <span className="text-slate-500">Como: </span>
          {how}
        </p>
      )}
      {where && (
        <p className="text-slate-300">
          <span className="text-slate-500">Onde: </span>
          {where}
        </p>
      )}
      {(chatLink || teleportLabel) && (
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sky-200">
          {teleportLabel && (
            <span className="min-w-0 break-safe">Mapa: {teleportLabel}</span>
          )}
          {chatLink && <CopyButton text={chatLink} label="Copiar waypoint" />}
        </div>
      )}
      {wikiUrl && (
        <a
          href={wikiUrl}
          target="_blank"
          rel="noreferrer"
          className="neon-link inline-block hover:underline"
        >
          {wikiLabel}
        </a>
      )}
    </div>
  );
}
