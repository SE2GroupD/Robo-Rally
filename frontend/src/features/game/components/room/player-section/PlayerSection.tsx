import type { JoinedRoom } from '../../../api/gameApi';
import { AVATAR_MAP } from '../../../data/avatars';

export function PlayerSection({ room }: { room: JoinedRoom }) {
  return (
    <section className="rounded border border-metal-light p-4">
      <h2 className="mb-3 mt-0 text-lg font-bold">Players</h2>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {room.players.map((player) => {
          const hasRobot = player.avatarId !== null && player.avatarId !== undefined;
          const hasPosition = player.startPosition !== null && player.startPosition !== undefined;
          const isReady = hasRobot && hasPosition;

          return (
            <li
              key={player.playerId}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/5 bg-slate-900/40 p-2.5"
            >
              <div className="flex items-center gap-2">
                {player.avatarId && AVATAR_MAP[player.avatarId] ? (
                  <img
                    src={AVATAR_MAP[player.avatarId]}
                    alt={`Robot ${player.avatarId}`}
                    className="h-7 w-7 rounded border border-metal-light bg-slate-800 p-0.5 object-contain"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded border border-dashed border-metal-light bg-slate-900 text-xs text-text-muted"
                    title="No robot selected"
                  >
                    ?
                  </div>
                )}
                <span className="font-medium text-white">{player.playerName}</span>
                <span className="text-xs text-text-muted">
                  {player.playerId === room.hostPlayerId ? 'Host' : 'Guest'}
                  {player.playerId === room.playerId ? ' · You' : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasRobot ? (
                  <span className="rounded border border-emerald-500/40 bg-emerald-950/70 px-2 py-0.5 text-xs text-emerald-300">
                    Robot {player.avatarId}
                  </span>
                ) : (
                  <span className="rounded border border-amber-500/40 bg-amber-950/70 px-2 py-0.5 text-xs text-amber-300">
                    No robot
                  </span>
                )}

                {hasPosition ? (
                  <span className="rounded border border-emerald-500/40 bg-emerald-950/70 px-2 py-0.5 text-xs text-emerald-300">
                    Tile
                  </span>
                ) : (
                  <span className="rounded border border-amber-500/40 bg-amber-950/70 px-2 py-0.5 text-xs text-amber-300">
                    No tile
                  </span>
                )}

                {isReady ? (
                  <span className="rounded-full border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    Ready
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/50 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                    Not ready
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
