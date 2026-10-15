import type { JoinedRoom } from '../../../api/gameApi';
import { useMapCatalog } from '../../../hooks/useMapCatalog';
import { StartTileMarkers, StartTileSelection } from './StartTileSelection';
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
        <StartTileMarkers layout={layout} room={room} disabled={locked} onSelect={onStart} />
      </MapCarusel>

      <StartTileSelection layout={layout} room={room} disabled={locked} onSelect={onStart} />

      {error && (
        <p role="alert" className="m-0 text-hazard">
          {error}
        </p>
      )}
    </section>
  );
}
