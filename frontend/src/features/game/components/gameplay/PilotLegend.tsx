import type { JoinedRoom } from '../../api/gameApi';
import type { AvatarId } from '../../types/Board';
import { AVATAR_MAP } from '../../data/avatars';

interface PilotLegendProps {
  rosterPlayers: (JoinedRoom['players'][number] & { avatarId: AvatarId })[];
  currentPlayerId: string;
  lockedInPlayerIds: string[];
  readinessState: Record<string, boolean>;
}

export function PilotLegend({ rosterPlayers, currentPlayerId, lockedInPlayerIds, readinessState }: PilotLegendProps) {
  return (
    <aside
      aria-label="Pilot robot legend"
      className="pointer-events-none absolute left-1/2 top-14 z-20 flex max-w-[calc(100%-12rem)] -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-white shadow-lg backdrop-blur-sm"
    >
      <h2 className="m-0 shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Pilots</h2>
      <ul className="m-0 flex min-w-0 list-none items-center gap-4 border-l border-slate-700/80 pl-3">
        {rosterPlayers.map((player) => {
          const isReady = lockedInPlayerIds.includes(player.playerId) || readinessState[player.playerId];

          return (
            <li
              key={player.playerId}
              className={`flex min-w-0 items-center gap-2 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}
            >
              <div className="relative">
                <img src={AVATAR_MAP[player.avatarId as AvatarId]} alt="" className="h-8 w-8 shrink-0 object-contain" />
                {/* Badge overlay on the avatar */}
                {isReady && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow ring-2 ring-slate-900"
                    title="Ready"
                  >
                    ✓
                  </span>
                )}
              </div>

              <span
                className={player.playerId === currentPlayerId ? 'truncate font-bold text-cyan-200' : 'truncate text-slate-200'}
              >
                {player.playerId === currentPlayerId ? 'You' : player.playerName}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
