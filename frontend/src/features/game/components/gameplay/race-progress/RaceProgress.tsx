import type { JoinedRoom } from '../../../api/gameApi';
import type { CheckpointProgressDto } from '../../../types/GameStateDto';
import { rankRacePlayers } from '../../../data/raceStandings';
import { RacePlayerWidget } from './RacePlayerWidget';

interface RaceProgressProps {
  players: JoinedRoom['players'];
  progress: readonly CheckpointProgressDto[];
  totalCheckpoints: number;
  currentPlayerId: string;
  winnerId?: string;
  lockedInPlayerIds: string[];
  readinessState: Record<string, boolean>;
}

export function RaceProgress({
  players,
  progress,
  totalCheckpoints,
  currentPlayerId,
  winnerId,
  lockedInPlayerIds,
  readinessState,
}: RaceProgressProps) {
  const standings = rankRacePlayers(players, progress, winnerId);
  return (
    <section aria-label="Race positions" className="w-full min-w-0">
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0.5">
        {standings.map((player) => (
          <li key={player.playerId} className="min-w-0 shrink-0">
            <RacePlayerWidget
              player={player}
              totalCheckpoints={totalCheckpoints}
              isCurrentPlayer={player.playerId === currentPlayerId}
              ready={lockedInPlayerIds.includes(player.playerId) || Boolean(readinessState[player.playerId])}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
