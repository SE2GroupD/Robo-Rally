import type { JoinedRoom } from '../../../api/gameApi';
import { StartBoard } from '../../map/boards/StartBoard';
import { TILE_PITCH, TILE_SIZE } from '../../../data/boardGeometry';

interface LegacyStartSelectionProps {
  room: JoinedRoom;
  disabled: boolean;
  error: string;
  onSelect: (x: number, y: number) => void;
}

/** Standalone rooms from the older API have spawn data but no catalog map ID. */
export function LegacyStartSelection({ room, disabled, error, onSelect }: LegacyStartSelectionProps) {
  const tiles = room.startBoardConfig ?? [];

  return (
    <section className="flex flex-col items-center rounded border border-metal-light p-4">
      <h2 className="mb-3 mt-0 text-lg font-bold">Select Start Position</h2>
      <div className="relative">
        <StartBoard layoutData={tiles} />
        {tiles
          .filter((tile) => tile.isSpawnPoint)
          .map((tile, index) => {
            const owner = room.players.find((player) => player.startPosition?.x === tile.x && player.startPosition?.y === tile.y);
            const mine = owner?.playerId === room.playerId;

            return (
              <button
                key={`${tile.x}-${tile.y}`}
                type="button"
                aria-label={`Start ${index + 1} · ${mine ? 'You' : (owner?.playerName ?? 'Available')}`}
                aria-pressed={mine}
                disabled={disabled || room.status !== 'WAITING' || (!!owner && !mine)}
                onClick={() => onSelect(tile.x, tile.y)}
                className={`absolute z-40 border-2 font-bold text-black focus-visible:outline-2 focus-visible:outline-white ${mine ? 'border-hazard bg-hazard/30' : owner ? 'border-metal bg-slate-800/70 text-white' : 'border-metal-light bg-transparent'}`}
                style={{ left: tile.x * TILE_PITCH, top: tile.y * TILE_PITCH, width: TILE_SIZE, height: TILE_SIZE }}
              >
                {index + 1}
              </button>
            );
          })}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
