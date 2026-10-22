import type { MatchResults } from '../../../types/MatchResults';
import { ResultRobot } from './ResultRobot';

const places = [
  {
    rank: 1,
    label: '1st',
    style: 'self-start border-hazard bg-hazard/10 sm:col-start-2 sm:row-start-1',
    medal: 'text-hazard',
    height: 'sm:pb-12',
  },
  {
    rank: 2,
    label: '2nd',
    style: 'border-metal-light bg-metal-ghost sm:col-start-1 sm:row-start-1 sm:mt-10',
    medal: 'text-metal-light',
    height: 'sm:pb-6',
  },
  {
    rank: 3,
    label: '3rd',
    style: 'border-robot-orange bg-robot-orange/10 sm:col-start-3 sm:row-start-1 sm:mt-16',
    medal: 'text-robot-orange',
    height: '',
  },
];

export function RacePodium({ results, currentPlayerId }: { results: MatchResults; currentPlayerId: string }) {
  return (
    <div aria-label="Race podium" className="grid items-end gap-3 sm:grid-cols-3">
      {places.map(({ rank, label, style, medal, height }) => {
        const racers = results.standings.filter((entry) => entry.rank === rank);
        if (!racers.length) return null;
        return (
          <section
            key={rank}
            aria-label={`${label} place`}
            className={`min-w-0 rounded border-t-4 p-4 text-center ${style} ${height}`}
          >
            <h3 className={`m-0 text-3xl font-black italic ${medal}`}>
              {label}
              <span className="ml-2 text-xs font-bold not-italic uppercase">{racers.length > 1 ? 'Tied' : 'Place'}</span>
            </h3>
            <div className="mt-3 flex flex-col gap-4">
              {racers.map((racer) => (
                <div key={racer.playerId} className="flex flex-col items-center">
                  <ResultRobot
                    avatarId={racer.avatarId}
                    className={rank === 1 ? 'h-28 w-28 sm:h-36 sm:w-36' : 'h-20 w-20 sm:h-24 sm:w-24'}
                  />
                  <p className="m-0 mt-2 max-w-full break-words text-base font-bold">{racer.playerName}</p>
                  {racer.playerId === currentPlayerId && (
                    <span className="mt-1 text-xs font-bold uppercase tracking-widest text-hazard">You</span>
                  )}
                  <p className="m-0 mt-2 text-xs text-text-muted">
                    {racer.completedCheckpoints}/{results.totalCheckpoints} checkpoints
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
