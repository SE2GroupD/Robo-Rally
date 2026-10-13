import type { JoinedRoom } from '../../../api/gameApi';
import { useMapCatalog } from '../../../hooks/useMapCatalog';
import { mapBounds, rotateTiles, TILE_GAP, TILE_PITCH, TILE_SIZE } from '../../../data/boardGeometry';
import { MapCarusel } from './MapCarusel';
import { Button } from '../../../../../foundation/components/button/Button';

interface MapSelectionProps {
  room: JoinedRoom;
  disabled: boolean;
  error: string;
  onMap: (id: string) => void;
  onStart: (position: { x: number; y: number } | null) => void;
}

export function MapSelection({ room, disabled, error, onMap, onStart }: MapSelectionProps) {
  const catalog = useMapCatalog();
  const locked = disabled || room.status !== 'WAITING';
  const layout = catalog.maps.find((map) => map.id === room.mapId);

  if (catalog.loading) return <output>Loading maps…</output>;

  if (catalog.error || !layout) {
    return (
      <section className="rounded border border-metal-light p-4">
        <p role="alert">{catalog.error || 'The selected map is unavailable.'}</p>
        <Button onClick={catalog.retry} variant="secondary">
          Retry maps
        </Button>
      </section>
    );
  }

  const bounds = mapBounds(layout.boards);
  const spawns = layout.boards.flatMap((board) =>
    rotateTiles(board.tiles, board.kind, board.rotation)
      .filter((tile) => tile.isSpawnPoint)
      .map((tile) => ({ x: board.x + tile.x, y: board.y + tile.y })),
  );
  const current = room.players.find((player) => player.playerId === room.playerId);
  const occupiedBy = (position: { x: number; y: number }) =>
    room.players.find((player) => player.startPosition?.x === position.x && player.startPosition?.y === position.y);
  const label = (index: number) => {
    const player = occupiedBy(spawns[index]);
    return `Start ${index + 1} · ${player ? (player.playerId === room.playerId ? 'You' : player.playerName) : 'Available'}`;
  };

  return (
    <section aria-label="Map and start selection" className="space-y-4 rounded border border-metal-light p-4">
      <div>
        <h2 className="m-0 text-lg font-bold">Race map</h2>
        <p className="mb-0 mt-1 text-sm text-text-muted">
          {room.playerId === room.hostPlayerId
            ? 'Choose the course. Changing maps clears everyone’s start selection.'
            : 'The host chooses the course.'}
        </p>
      </div>

      <MapCarusel
        maps={catalog.maps}
        selectedId={room.mapId!}
        disabled={locked || room.playerId !== room.hostPlayerId}
        onSelect={onMap}
      >
        {spawns.map((position, index) => {
          const owner = occupiedBy(position);
          const mine = owner?.playerId === room.playerId;

          return (
            <button
              key={index}
              type="button"
              aria-label={label(index)}
              aria-pressed={mine}
              disabled={locked || (!!owner && !mine)}
              onClick={() => onStart(position)}
              className={`absolute flex items-center justify-center border-2 text-xs font-bold focus-visible:z-40 focus-visible:outline-2 focus-visible:outline-white ${mine ? 'border-white bg-hazard/30 text-black' : owner ? 'border-metal bg-slate-800/70 text-white' : 'border-hazard bg-transparent text-black'}`}
              style={{
                fontSize: 'clamp(6px, 1.5vw, 12px)',
                left: `${(((position.x - bounds.x) * TILE_PITCH) / (bounds.width * TILE_PITCH - TILE_GAP)) * 100}%`,
                top: `${(((position.y - bounds.y) * TILE_PITCH) / (bounds.height * TILE_PITCH - TILE_GAP)) * 100}%`,
                width: `${(TILE_SIZE / (bounds.width * TILE_PITCH - TILE_GAP)) * 100}%`,
                height: `${(TILE_SIZE / (bounds.height * TILE_PITCH - TILE_GAP)) * 100}%`,
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </MapCarusel>

      <h3 className="m-0 font-bold">Choose your start tile</h3>
      <div className="space-y-3">
        <div className="grid auto-cols-[minmax(9rem,1fr)] grid-flow-col gap-2 overflow-x-auto pb-1">
          {spawns.map((position, index) => {
            const owner = occupiedBy(position);
            const mine = owner?.playerId === room.playerId;

            return (
              <Button
                key={index}
                variant="secondary"
                size="small"
                aria-pressed={mine}
                disabled={locked || (!!owner && !mine)}
                onClick={() => onStart(position)}
                className="min-h-14 text-center break-words"
              >
                {label(index)}
              </Button>
            );
          })}
        </div>
        <Button
          variant="secondary"
          disabled={locked}
          aria-pressed={!current?.startPosition}
          onClick={() => onStart(null)}
          className="w-full"
        >
          {!current?.startPosition ? '✓ ' : ''}Assign me a free tile automatically
        </Button>
        <p className="m-0 text-sm text-text-muted">Unselected players receive a free tile when the battle starts.</p>
      </div>
      {error && (
        <p role="alert" className="m-0 text-hazard">
          {error}
        </p>
      )}
    </section>
  );
}
