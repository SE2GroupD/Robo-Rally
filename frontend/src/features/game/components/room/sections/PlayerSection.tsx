import type { JoinedRoom } from '../../../api/gameApi';
import { AVATAR_MAP } from '../../../data/avatars';

export function PlayerSection({ room }: { room: JoinedRoom }) {
  return (
    <section className="rounded border border-metal-light p-4">
      <h2 className="mb-3 mt-0 text-lg font-bold">Players</h2>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {room.players.map((player) => (
          <li key={player.playerId} className="flex items-center justify-between gap-3">
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
              <span>{player.playerName}</span>
            </div>

            <span>
              {player.playerId === room.hostPlayerId ? 'Host' : 'Guest'}
              {player.playerId === room.playerId ? ' · You' : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
