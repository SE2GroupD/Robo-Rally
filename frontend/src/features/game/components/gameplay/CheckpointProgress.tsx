import type { JoinedRoom } from '../../api/gameApi';
import type { CheckpointProgressDto } from '../../types/GameStateDto';
function completedLabel(progress: CheckpointProgressDto) {
  return progress.completedCheckpoints.length > 0 ? progress.completedCheckpoints.join(', ') : 'None';
}

export function CheckpointProgress({
  players,
  progress,
  totalCheckpoints,
}: {
  players: JoinedRoom['players'];
  progress: readonly CheckpointProgressDto[];
  totalCheckpoints: number;
}) {
  const progressByPlayer = new globalThis.Map(progress.map((entry) => [entry.playerId, entry]));

  return (
    <section
      aria-label="Checkpoint progress"
      className="absolute right-3 top-28 z-20 max-h-[calc(75dvh-8rem)] w-60 max-w-[calc(100%-1.5rem)] overflow-y-auto rounded border border-metal-light bg-slate-950/90 p-3 text-sm text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
    >
      <h2 className="m-0 text-sm font-bold text-metal-light">Checkpoint progress</h2>
      <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
        {players.map((player) => {
          const playerProgress = progressByPlayer.get(player.playerId);
          return (
            <li key={player.playerId} className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-bold">{player.playerName}</span>
                <span className="shrink-0 text-metal-light">Next {playerProgress?.nextCheckpoint ?? '-'}</span>
              </div>
              <p className="m-0 mt-1 text-xs text-text-muted">
                {playerProgress?.completedCheckpoints.length ?? 0} out of {totalCheckpoints} checkpoints completed
              </p>
              <p className="m-0 mt-0.5 text-xs text-text-muted">
                Claimed: {playerProgress ? completedLabel(playerProgress) : 'None'}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
