import { Button } from '../../../../../foundation/components/button/Button';
import type { JoinedRoom } from '../../../api/gameApi';
import { mapBounds, rotateTiles, TILE_GAP, TILE_PITCH, TILE_SIZE } from '../../../data/boardGeometry';
import type { MapLayoutData } from '../../../types/MapLayout';

interface StartTileSelectionProps {
  layout: MapLayoutData;
  room: JoinedRoom;
  disabled: boolean;
  onSelect: (position: { x: number; y: number } | null) => void;
}

/** Both controls use the same spawn order, coordinates and reservation labels. */
function getStartTiles(layout: MapLayoutData, room: JoinedRoom) {
  const positions = layout.boards.flatMap((board) =>
    rotateTiles(board.tiles, board.kind, board.rotation)
      .filter((tile) => tile.isSpawnPoint)
      .map((tile) => ({ x: board.x + tile.x, y: board.y + tile.y })),
  );

  return positions.map((position, index) => {
    const owner = room.players.find((player) => player.startPosition?.x === position.x && player.startPosition?.y === position.y);
    const mine = owner?.playerId === room.playerId;

    return {
      position,
      number: index + 1,
      mine,
      occupied: !!owner,
      label: `Start ${index + 1} · ${owner ? (mine ? 'You' : owner.playerName) : 'Available'}`,
    };
  });
}

/** Clickable spawn markers positioned over the selected map preview. */
export function StartTileMarkers({ layout, room, disabled, onSelect }: StartTileSelectionProps) {
  const bounds = mapBounds(layout.boards);
  const width = bounds.width * TILE_PITCH - TILE_GAP;
  const height = bounds.height * TILE_PITCH - TILE_GAP;
  const locked = disabled || room.status !== 'WAITING';

  return getStartTiles(layout, room).map(({ position, number, mine, occupied, label }) => (
    <button
      key={`${position.x}-${position.y}`}
      type="button"
      aria-label={label}
      aria-pressed={mine}
      disabled={locked || (occupied && !mine)}
      onClick={() => onSelect(position)}
      className={`absolute flex items-center justify-center border-2 text-xs font-bold focus-visible:z-40 focus-visible:outline-2 focus-visible:outline-white ${mine ? 'border-hazard bg-hazard/30 text-black' : occupied ? 'border-metal bg-slate-800/70 text-white' : 'border-metal-light bg-transparent text-black'}`}
      style={{
        fontSize: 'clamp(6px, 1.5vw, 12px)',
        left: `${(((position.x - bounds.x) * TILE_PITCH) / width) * 100}%`,
        top: `${(((position.y - bounds.y) * TILE_PITCH) / height) * 100}%`,
        width: `${(TILE_SIZE / width) * 100}%`,
        height: `${(TILE_SIZE / height) * 100}%`,
      }}
    >
      {number}
    </button>
  ));
}

/** Start-tile buttons and the choice to automatically pick an available tile. */
export function StartTileSelection({ layout, room, disabled, onSelect }: StartTileSelectionProps) {
  const startTiles = getStartTiles(layout, room);
  const firstAvailableTile = startTiles.find((t) => !t.occupied)?.position;
  const locked = disabled || room.status !== 'WAITING';

  return (
    <>
      <h3 className="mb-3 mt-0 text-lg font-bold">Choose your start tile</h3>
      <div className="space-y-3">
        <div className="grid auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-2 overflow-x-auto pb-1">
          {startTiles.map(({ position, mine, occupied, label }) => (
            <Button
              key={`${position.x}-${position.y}`}
              variant="secondary"
              size="small"
              aria-pressed={mine}
              disabled={locked || (occupied && !mine)}
              onClick={() => onSelect(position)}
              className="min-h-14 text-center break-words"
            >
              {label}
            </Button>
          ))}
        </div>
        <Button
          variant="secondary"
          disabled={locked || !firstAvailableTile}
          onClick={() => firstAvailableTile && onSelect(firstAvailableTile)}
          className="w-full"
        >
          Assign me a free tile automatically
        </Button>
        <p className="m-0 text-sm text-text-muted">Picks an available start tile for you automatically.</p>
      </div>
    </>
  );
}
