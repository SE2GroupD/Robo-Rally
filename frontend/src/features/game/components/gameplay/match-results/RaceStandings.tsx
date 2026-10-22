import type { MatchResults } from '../../../types/MatchResults';
import { ResultRobot } from './ResultRobot';

export function RaceStandings({ results, currentPlayerId }: { results: MatchResults; currentPlayerId: string }) {
  return (
    <section aria-labelledby="race-standings-heading" className="mt-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="race-standings-heading" className="m-0 text-sm font-bold uppercase tracking-widest text-metal-light">
          Final standings
        </h3>
        <p className="m-0 text-xs text-text-muted">Equal checkpoint progress shares a place.</p>
      </div>
      <ol className="m-0 list-none divide-y divide-metal-dark border-y border-metal-dark p-0">
        {results.standings.map((racer) => (
          <li key={racer.playerId} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-7 shrink-0 text-center font-bold text-metal-light" aria-label={`Place ${racer.rank}`}>
              {racer.rank}
            </span>
            <ResultRobot avatarId={racer.avatarId} className="h-8 w-8 shrink-0" />
            <span className="min-w-0 flex-1 break-words font-semibold">
              {racer.playerName}
              {racer.playerId === currentPlayerId && <span className="ml-2 text-xs text-hazard">You</span>}
            </span>
            <span className="shrink-0 text-text-muted">
              {racer.completedCheckpoints}/{results.totalCheckpoints}
              <span className="sr-only"> checkpoints</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
